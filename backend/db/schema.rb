# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_03_090000) do
  create_table "places", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "area"
    t.datetime "created_at", null: false
    t.string "genre"
    t.string "name", null: false
    t.text "note"
    t.string "price_range"
    t.string "tabelog_url", null: false
    t.datetime "updated_at", null: false
    t.string "visit_status", null: false
    t.index ["tabelog_url"], name: "index_places_on_tabelog_url", unique: true
    t.check_constraint "`visit_status` in (_utf8mb4'visited',_utf8mb4'not_visited')", name: "visit_status_allowed_values"
  end
end
