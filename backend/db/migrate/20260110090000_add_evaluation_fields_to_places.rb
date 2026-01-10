# frozen_string_literal: true

class AddEvaluationFieldsToPlaces < ActiveRecord::Migration[8.1]
  def change
    add_column :places, :visit_reason, :text
    add_column :places, :revisit_intent, :string

    add_check_constraint :places,
                         "revisit_intent in ('yes','no','unknown') OR revisit_intent IS NULL",
                         name: "revisit_intent_allowed_values"
  end
end
