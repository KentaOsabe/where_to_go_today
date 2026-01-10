# frozen_string_literal: true

require "json"
require "net/http"
require "set"

class OpenAiRecommendationService
  API_URL = "https://api.openai.com/v1/responses"
  DEFAULT_MODEL = "gpt-5-nano"
  DEFAULT_TEMPERATURE = 0.7

  def initialize(api_key_path: Rails.root.join("..", "openai_apikey"), http_client: Net::HTTP,
                 model: DEFAULT_MODEL, temperature: DEFAULT_TEMPERATURE)
    @api_key_path = api_key_path
    @http_client = http_client
    @model = model
    @temperature = temperature
  end

  def refine(primary_candidates:, conditions:, limit: 5)
    candidates = Array(primary_candidates)
    return fallback(candidates, conditions, limit: limit) if candidates.empty?

    api_key = read_api_key
    return fallback(candidates, conditions, limit: limit) if api_key.blank?

    response = request_openai(api_key, candidates, conditions, limit)
    return fallback(candidates, conditions, limit: limit) unless response.respond_to?(:code) && response.respond_to?(:body)
    return fallback(candidates, conditions, limit: limit) unless response.code.to_i == 200

    recommendations = parse_recommendations(response.body, candidates, conditions, limit)
    return fallback(candidates, conditions, limit: limit) if recommendations.empty?

    recommendations
  rescue StandardError
    fallback(candidates, conditions, limit: limit)
  end

  private

  def request_openai(api_key, candidates, conditions, limit)
    uri = URI(API_URL)
    request = Net::HTTP::Post.new(uri)
    request["Authorization"] = "Bearer #{api_key}"
    request["Content-Type"] = "application/json"
    request.body = build_payload(candidates, conditions, limit).to_json

    @http_client.start(uri.host, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
  end

  def build_payload(candidates, conditions, limit)
    {
      model: @model,
      temperature: @temperature,
      input: [
        {
          role: "system",
          content: "You select up to #{limit} places and write short reasons in Japanese."
        },
        {
          role: "user",
          content: build_prompt(candidates, normalize_conditions(conditions), limit)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "recommendations",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["recommendations"],
            properties: {
              recommendations: {
                type: "array",
                maxItems: limit,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "reason"],
                  properties: {
                    id: { type: "integer" },
                    reason: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  end

  def build_prompt(candidates, conditions, limit)
    lines = []
    lines << "条件:"
    lines << "ジャンル: #{display_value(conditions[:genre])}"
    lines << "エリア: #{display_value(conditions[:area])}"
    lines << "予算帯: #{display_value(conditions[:price_range])}"
    lines << ""
    lines << "候補一覧:"
    candidates.each do |place|
      lines << format_candidate(place)
    end
    lines << ""
    lines << "上記から最大#{limit}件を選び、理由を短く書いてください。"
    lines.join("\n")
  end

  def format_candidate(place)
    [
      "- id: #{place.id}",
      "name: #{place.name}",
      "genre: #{display_value(place.genre)}",
      "area: #{display_value(place.area)}",
      "price_range: #{display_value(place.price_range)}",
      "visit_status: #{display_value(place.visit_status)}",
      "revisit_intent: #{display_value(place.revisit_intent)}",
      "visit_reason: #{display_value(place.visit_reason)}"
    ].join(", ")
  end

  def parse_recommendations(body, candidates, conditions, limit)
    payload = JSON.parse(body)
    output_text = extract_output_text(payload)
    return [] if output_text.blank?

    parsed = JSON.parse(output_text)
    items = parsed.fetch("recommendations", [])
    return [] unless items.is_a?(Array)

    candidate_map = candidates.index_by(&:id)
    seen = Set.new
    results = []

    items.each do |item|
      next unless item.is_a?(Hash)

      id = item["id"] || item[:id]
      place = candidate_map[id.to_i]
      next unless place
      next if seen.include?(place.id)

      reason = item["reason"] || item[:reason]
      reason = reason.to_s.strip
      reason = template_reason(place, conditions) if reason.blank?

      results << { place: place, reason: reason }
      seen << place.id
      break if results.size >= limit
    end

    results
  rescue JSON::ParserError
    []
  end

  def extract_output_text(payload)
    outputs = payload["output"]
    return "" unless outputs.is_a?(Array)

    texts = outputs.flat_map do |output|
      next [] unless output.is_a?(Hash)

      content = output["content"]
      next [] unless content.is_a?(Array)

      content.filter_map do |item|
        item.is_a?(Hash) && item["type"] == "output_text" ? item["text"] : nil
      end
    end

    texts.join
  end

  def fallback(candidates, conditions, limit:)
    normalized_conditions = normalize_conditions(conditions)
    candidates.first(limit).map do |place|
      { place: place, reason: template_reason(place, normalized_conditions) }
    end
  end

  def template_reason(place, conditions)
    matches = []
    matches << "ジャンル: #{place.genre}" if matches_condition?(place.genre, conditions[:genre])
    matches << "エリア: #{place.area}" if matches_condition?(place.area, conditions[:area])
    matches << "予算帯: #{place.price_range}" if matches_condition?(place.price_range, conditions[:price_range])

    return "登録済みの候補から選びました。" if matches.empty?

    "条件に近い: #{matches.join(' / ')}"
  end

  def matches_condition?(place_value, condition_value)
    return false if condition_value.blank? || place_value.blank?

    place_value.to_s.downcase.include?(condition_value.to_s.downcase)
  end

  def normalize_conditions(conditions)
    (conditions || {}).to_h.transform_keys { |key| key.to_s.to_sym }.transform_values do |value|
      value.is_a?(String) ? value.strip.presence : value
    end
  end

  def display_value(value)
    value.present? ? value.to_s : "未設定"
  end

  def read_api_key
    return nil unless File.exist?(@api_key_path)

    key = File.read(@api_key_path).to_s.strip
    key.presence
  rescue Errno::ENOENT
    nil
  end
end
