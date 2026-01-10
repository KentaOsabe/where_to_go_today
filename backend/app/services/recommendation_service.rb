# frozen_string_literal: true

class RecommendationService
  def initialize(conditions:, scope: Place.all)
    @conditions = normalize_conditions(conditions)
    @scope = scope
  end

  def primary_candidates(limit: 10)
    scored = @scope.to_a.map { |place| [place, score_for(place)] }
    sorted = scored.sort_by { |place, score| sort_key(place, score) }
    sorted.first(limit).map(&:first)
  end

  private

  def normalize_conditions(conditions)
    (conditions || {}).to_h.transform_keys { |key| key.to_s.to_sym }.transform_values do |value|
      value.is_a?(String) ? value.strip.presence : value
    end
  end

  def score_for(place)
    score = 0
    score += 2 if matches_condition?(place.genre, @conditions[:genre])
    score += 2 if matches_condition?(place.area, @conditions[:area])
    score += 1 if matches_condition?(place.price_range, @conditions[:price_range])

    score += 2 if place.revisit_intent == "yes"
    score -= 2 if place.revisit_intent == "no"
    score += 1 if place.visit_reason.present?

    score
  end

  def matches_condition?(place_value, condition_value)
    return false if condition_value.blank? || place_value.blank?

    place_value.to_s.downcase.include?(condition_value.to_s.downcase)
  end

  def sort_key(place, score)
    visit_status_priority = place.visit_status == "not_visited" ? 0 : 1
    updated_at_priority = -(place.updated_at.to_i)
    [-score, visit_status_priority, updated_at_priority]
  end
end
