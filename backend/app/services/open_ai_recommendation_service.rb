# frozen_string_literal: true

require "json"
require "net/http"
require "set"

class OpenAiRecommendationService
  class RecommendationError < StandardError; end

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
    return [] if candidates.empty?

    api_key = read_api_key
    raise RecommendationError, "missing_api_key" if api_key.blank?

    response = request_openai(api_key, candidates, conditions, limit)
    unless response.respond_to?(:code) && response.respond_to?(:body)
      raise RecommendationError, "invalid_response"
    end
    raise RecommendationError, "request_failed" unless response.code.to_i == 200

    recommendations = parse_recommendations(response.body, candidates, limit)
    raise RecommendationError, "invalid_output" if recommendations.empty?

    recommendations
  rescue RecommendationError
    raise
  rescue StandardError
    raise RecommendationError, "request_failed"
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
          content: build_prompt(candidates, conditions, limit)
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
    condition_text = extract_condition_text(conditions)
    lines = []
    lines << "あなたは「今日どこ行く？」を一緒に考えるアシスタントです。"
    lines << ""
    lines << "【今日の条件】"
    lines << condition_text
    lines << ""
    lines << "【候補となるお店一覧】"
    candidates.each do |place|
      lines << format_candidate(place)
    end
    lines << ""
    lines << "制約:"
    lines << "- 最大#{limit}件まで選んでください"
    lines << "- 条件に完全一致する必要はありません"
    lines << "- 行ったことのない店を1〜2件含めてください"
    lines << "- 明らかに条件と外れる店は除外してください"
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
      "visit_reason: #{display_value(place.visit_reason)}",
      "note: #{display_value(place.note)}"
    ].join(", ")
  end

  def parse_recommendations(body, candidates, limit)
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
      next if reason.blank?

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

  def display_value(value)
    value.present? ? value.to_s : "未設定"
  end

  def extract_condition_text(conditions)
    text = if conditions.respond_to?(:[]) then conditions[:condition_text] else nil end
    value = text.to_s.strip
    value.present? ? value : "条件なし"
  end

  def read_api_key
    return nil unless File.exist?(@api_key_path)

    key = File.read(@api_key_path).to_s.strip
    key.presence
  rescue Errno::ENOENT
    nil
  end
end
