-- Add missing columns if they don't exist
DO $$ 
BEGIN 
  -- Check if right_team_status column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'right_team_status') THEN
    ALTER TABLE project_status ADD COLUMN right_team_status text;
  END IF;

  -- Check if delivery_comments column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'delivery_comments') THEN
    ALTER TABLE project_status ADD COLUMN delivery_comments text;
  END IF;

  -- Check if am_status column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'am_status') THEN
    ALTER TABLE project_status ADD COLUMN am_status text;
  END IF;

  -- Check if am_comments column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'am_comments') THEN
    ALTER TABLE project_status ADD COLUMN am_comments text;
  END IF;

  -- Check if governance_status column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'governance_status') THEN
    ALTER TABLE project_status ADD COLUMN governance_status text;
  END IF;

  -- Check if last_governance_meeting_date column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'last_governance_meeting_date') THEN
    ALTER TABLE project_status ADD COLUMN last_governance_meeting_date text;
  END IF;

  -- Check if last_invoice_date column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'last_invoice_date') THEN
    ALTER TABLE project_status ADD COLUMN last_invoice_date text;
  END IF;

  -- Check if last_receivable_date column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'last_receivable_date') THEN
    ALTER TABLE project_status ADD COLUMN last_receivable_date text;
  END IF;

  -- Check if next_invoice_date column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'next_invoice_date') THEN
    ALTER TABLE project_status ADD COLUMN next_invoice_date text;
  END IF;

  -- Check if invoice_status column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'invoice_status') THEN
    ALTER TABLE project_status ADD COLUMN invoice_status text;
  END IF;
END $$;