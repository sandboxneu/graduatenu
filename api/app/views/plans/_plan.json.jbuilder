json.(plan, :id, :name, :link_sharing_enabled, :schedule, :major, :coop_cycle, :concentration, :course_warnings, :warnings, :course_counter, :catalog_year, :last_viewed, :approved_schedule, :updated_at, :last_viewer, :last_requested_approval)

json.is_currently_being_edited_by_student plan.being_edited_by_student?
json.is_currently_being_edited_by_advisor plan.being_edited_by_advisor?
