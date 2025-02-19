/*
  # Add initial challenges

  1. New Data
    - Adds initial challenges including today's challenge
    - Adds challenges for the next few days

  2. Changes
    - Inserts sample challenges into the challenges table
*/

INSERT INTO public.challenges (title, description, start_date, end_date, is_special)
VALUES
  ('Mystical Forest', 'Create a magical forest scene with mysterious creatures hiding among the trees. Focus on creating an enchanting atmosphere using light and shadows.', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', false),
  ('Urban Sketching', 'Draw a scene from your city or neighborhood. Pay attention to architectural details and the play of light on buildings.', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', false),
  ('Character Design', 'Design an original character inspired by your favorite book or movie. Include both a full-body sketch and close-up details.', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', false),
  ('Abstract Emotions', 'Create an abstract piece that represents a strong emotion. Use color and form to convey the feeling without literal representation.', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', false),
  ('Still Life Study', 'Arrange and draw a collection of objects from your daily life. Focus on composition and accurate representation of textures.', CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '5 days', false)
ON CONFLICT (id) DO NOTHING;