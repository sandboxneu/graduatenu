# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `rails
# db:schema:load`. When creating a new database, `rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_01_28_003742) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "folders", force: :cascade do |t|
    t.string "name"
    t.bigint "user_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "plan_changelogs", force: :cascade do |t|
    t.string "log", null: false
    t.bigint "author_id", null: false
    t.bigint "plan_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["plan_id"], name: "index_plan_changelogs_on_plan_id"
  end

  create_table "plan_comments", force: :cascade do |t|
    t.string "author", null: false
    t.string "comment", null: false
    t.bigint "plan_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["plan_id"], name: "index_plan_comments_on_plan_id"
  end

  create_table "plans", force: :cascade do |t|
    t.string "name"
    t.boolean "link_sharing_enabled"
    t.json "schedule"
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "major"
    t.string "coop_cycle"
    t.json "course_warnings", default: [], array: true
    t.json "warnings", default: [], array: true
    t.integer "course_counter"
    t.integer "catalog_year", default: 2018
    t.datetime "last_viewed"
    t.json "approved_schedule"
    t.bigint "last_viewer"
    t.datetime "last_requested_approval"
    t.string "concentration"
    t.index ["user_id"], name: "index_plans_on_user_id"
  end

  create_table "template_plans", force: :cascade do |t|
    t.string "name", null: false
    t.integer "catalog_year", null: false
    t.json "schedule"
    t.string "major", null: false
    t.string "coop_cycle"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "folder_id"
    t.string "concentration"
    t.integer "course_counter"
    t.index ["folder_id"], name: "index_template_plans_on_folder_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "full_name"
    t.integer "academic_year"
    t.integer "graduation_year"
    t.string "major"
    t.string "coop_cycle"
    t.integer "catalog_year"
    t.string "image_url"
    t.boolean "is_advisor", default: false, null: false
    t.json "courses_completed", default: [], array: true
    t.json "courses_transfer", default: [], array: true
    t.bigint "primary_plan_id"
    t.string "concentration"
    t.text "email_ciphertext"
    t.text "nu_id_ciphertext"
    t.string "email_bidx"
    t.string "nu_id_bidx"
    t.index ["email_bidx"], name: "index_users_on_email_bidx", unique: true
    t.index ["full_name"], name: "index_users_on_full_name"
    t.index ["nu_id_bidx"], name: "index_users_on_nu_id_bidx", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "plans", "users"
end
