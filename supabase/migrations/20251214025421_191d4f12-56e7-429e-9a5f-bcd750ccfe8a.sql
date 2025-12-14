-- Update site_settings to support multiple videos
UPDATE site_settings 
SET setting_value = '[{"id": "1", "title": "Traditional Coffee Ceremony", "url": "https://www.youtube.com/embed/GfEh2CqdXt8?rel=0", "description": "Witness the full Ethiopian coffee ceremony ritual"}]'::jsonb,
    description = 'Video list for the Learn page coffee ceremony section'
WHERE setting_key = 'learn_page_video_url';

-- Rename the setting key to reflect multiple videos
UPDATE site_settings 
SET setting_key = 'learn_page_videos'
WHERE setting_key = 'learn_page_video_url';