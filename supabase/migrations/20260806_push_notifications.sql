-- Table to store user FCM Push Notification tokens
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT UNIQUE NOT NULL,
    device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own push tokens"
ON public.user_push_tokens
FOR ALL
USING (auth.uid() = user_id);

-- Supabase Edge Function Database Trigger Example for Task Reminders
CREATE OR REPLACE FUNCTION notify_task_due()
RETURNS TRIGGER AS $$
BEGIN
    -- Calls Supabase Edge Function 'send-push-notification'
    PERFORM net.http_post(
        url := 'https://your-supabase-project.supabase.co/functions/v1/send-push-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
        body := json_build_object(
            'task_id', NEW.id,
            'title', NEW.title,
            'user_id', NEW.user_id
        )::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
