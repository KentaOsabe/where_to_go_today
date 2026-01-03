# frozen_string_literal: true

class CreatePlaces < ActiveRecord::Migration[8.1]
  def change
    create_table :places do |t|
      t.string :name, null: false
      t.string :tabelog_url, null: false
      t.string :visit_status, null: false
      t.string :genre
      t.string :area
      t.string :price_range
      t.text :note

      t.timestamps null: false
    end

    add_index :places, :tabelog_url, unique: true
    add_check_constraint :places,
                         "visit_status in ('visited', 'not_visited')",
                         name: "visit_status_allowed_values"
  end
end
