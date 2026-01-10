# frozen_string_literal: true

module Api
  class RecommendationsController < ApplicationController
    skip_before_action :verify_authenticity_token

    def create
      conditions = recommendation_conditions
      primary_candidates = RecommendationService.new(conditions: conditions, scope: Place.all).primary_candidates
      recommendations = OpenAiRecommendationService.new.refine(
        primary_candidates: primary_candidates,
        conditions: conditions
      )

      render json: {
        conditions: conditions,
        recommendations: recommendations.map { |item| format_recommendation(item) }
      }
    rescue StandardError
      render json: { error: "recommendation_failed" }, status: :internal_server_error
    end

    private

    def recommendation_conditions
      {
        genre: params[:genre],
        area: params[:area],
        price_range: params[:price_range]
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
