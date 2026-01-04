-- Seed data for meeting_rooms table
-- All room names start with "Room of"

INSERT INTO meeting_rooms (meeting_room_name, meeting_room_slug, meeting_room_capacity, meeting_room_price_per_hour, meeting_room_size, meeting_room_images) VALUES
  ('Room of Innovation', 'room-of-innovation', 10, 50.00, 25.00, ARRAY['https://picsum.photos/400/300?random=1']),
  ('Room of Collaboration', 'room-of-collaboration', 15, 75.00, 35.00, ARRAY['https://picsum.photos/400/300?random=2']),
  ('Room of Creativity', 'room-of-creativity', 8, 45.00, 20.00, ARRAY['https://picsum.photos/400/300?random=3']),
  ('Room of Strategy', 'room-of-strategy', 20, 100.00, 50.00, ARRAY['https://picsum.photos/400/300?random=4']),
  ('Room of Focus', 'room-of-focus', 6, 40.00, 15.00, ARRAY['https://picsum.photos/400/300?random=5']),
  ('Room of Discovery', 'room-of-discovery', 12, 60.00, 30.00, ARRAY['https://picsum.photos/400/300?random=6']),
  ('Room of Excellence', 'room-of-excellence', 25, 125.00, 60.00, ARRAY['https://picsum.photos/400/300?random=7']),
  ('Room of Success', 'room-of-success', 18, 90.00, 45.00, ARRAY['https://picsum.photos/400/300?random=8']);

