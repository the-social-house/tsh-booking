-- Seed data for meeting_room_amenities table
-- Linking amenities to meeting rooms

INSERT INTO meeting_room_amenities (meeting_room_id, amenity_id) VALUES
  (1, 1), (1, 2), (1, 5), -- Room of Innovation: Projector, Whiteboard, WiFi
  (2, 1), (2, 3), (2, 5), -- Room of Collaboration: Projector, Video Conferencing, WiFi
  (3, 2), (3, 5),         -- Room of Creativity: Whiteboard, WiFi
  (4, 1), (4, 3), (4, 5), -- Room of Strategy: Projector, Video Conferencing, WiFi
  (5, 2), (5, 5),         -- Room of Focus: Whiteboard, WiFi
  (6, 1), (6, 2), (6, 5), -- Room of Discovery: Projector, Whiteboard, WiFi
  (7, 1), (7, 3), (7, 4), (7, 5), -- Room of Excellence: All amenities
  (8, 1), (8, 3), (8, 5); -- Room of Success: Projector, Video Conferencing, WiFi

