# frozen_string_literal: true

module Api
  class RecommendationsController < ApplicationController
    skip_before_action :verify_authenticity_token

    def create
      conditions = recommendation_conditions
      if conditions[:condition_text].blank?
        render json: { error: "condition_text_required" }, status: :unprocessable_entity
        return
      end

      primary_candidates = Place.order(updated_at: :desc)
      recommendations = OpenAiRecommendationService.new.refine(
        primary_candidates: primary_candidates,
        conditions: conditions
      )

      render json: {
        condition_text: conditions[:condition_text],
        recommendations: recommendations.map { |item| format_recommendation(item) }
      }
    rescue StandardError
      render json: { error: "recommendation_failed" }, status: :internal_server_error
    end

    private

    def recommendation_conditions
      {
        condition_text: params[:condition_text].to_s.strip
      }
    end

    def format_recommendation(item)
      {
        place: item[:place],
        reason: item[:reason]
      }
    end
  end
end
