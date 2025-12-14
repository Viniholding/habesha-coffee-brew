-- Add learn page video URL to site_settings
INSERT INTO site_settings (setting_key, setting_value, description)
VALUES ('learn_page_video_url', '"https://www.youtube.com/embed/GfEh2CqdXt8?rel=0"', 'Video URL for the Learn page coffee ceremony video')
ON CONFLICT (setting_key) DO NOTHING;