# frozen_string_literal: true

require "uri"

class Place < ApplicationRecord
  VISIT_STATUSES = %w[visited not_visited].freeze

  before_validation :normalize_tabelog_url

  validates :name, presence: true
  validates :tabelog_url, presence: true, uniqueness: { case_sensitive: false }
  validates :visit_status, presence: true, inclusion: { in: VISIT_STATUSES }
  validate :tabelog_url_domain

  private

  def normalize_tabelog_url
    return if tabelog_url.blank?

    normalized = tabelog_url.strip
    begin
      uri = URI.parse(normalized)
    rescue URI::InvalidURIError
      self.tabelog_url = normalized
      return
    end

    if uri.is_a?(URI::HTTP)
      uri.query = nil
      uri.scheme = "https"
      uri.host = uri.host.downcase if uri.host.present?

      if uri.path.present?
        uri.path = uri.path.sub(%r{/\z}, "")
      end

      normalized = uri.to_s
    end

    self.tabelog_url = normalized
  end

  def tabelog_url_domain
    return if tabelog_url.blank?

    uri = URI.parse(tabelog_url)
    unless uri.is_a?(URI::HTTP) && uri.host.present?
      errors.add(:tabelog_url, "はhttps://tabelog.com のURLを入力してください")
      return
    end

    host = uri.host.downcase
    return if host == "tabelog.com" || host.end_with?(".tabelog.com")

    errors.add(:tabelog_url, "はtabelog.com ドメインのURLを入力してください")
  rescue URI::InvalidURIError
    errors.add(:tabelog_url, "はhttps://tabelog.com のURLを入力してください")
  end
end
