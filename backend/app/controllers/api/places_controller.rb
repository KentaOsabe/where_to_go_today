# frozen_string_literal: true

module Api
  class PlacesController < ApplicationController
    skip_before_action :verify_authenticity_token
    rescue_from ActiveRecord::RecordNotUnique, with: :handle_record_not_unique

    def create
      place = Place.new(place_params)

      if place.save
        render json: place, status: :created
      else
        render_validation_errors(place)
      end
    end

    def show
      place = Place.find(params[:id])
      render json: place
    end

    private

    def place_params
      params.permit(
        :name,
        :tabelog_url,
        :visit_status,
        :genre,
        :area,
        :price_range,
        :note
      )
    end

    def render_validation_errors(place)
      if duplicate_url?(place)
        render_duplicate(place.tabelog_url)
      else
        render json: { errors: place.errors.messages }, status: :unprocessable_entity
      end
    end

    def duplicate_url?(place)
      place.errors.details[:tabelog_url].any? { |detail| detail[:error] == :taken }
    end

    def handle_record_not_unique
      render_duplicate(normalized_tabelog_url)
    end

    def render_duplicate(normalized_url)
      existing = Place.find_by(tabelog_url: normalized_url)
      render json: {
        errors: { tabelog_url: ["すでに登録されています"] },
        existing_place_id: existing&.id
      }, status: :conflict
    end

    def normalized_tabelog_url
      url = params[:tabelog_url]
      return if url.blank?

      place = Place.new(tabelog_url: url)
      place.valid?
      place.tabelog_url
    end
  end
end
