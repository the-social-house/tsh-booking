-- Seed data for booking_amenities table
-- Linking amenities to bookings

INSERT INTO booking_amenities (booking_id, amenity_id) VALUES
  (1, 1), (1, 5),           -- Booking 1: Projector, WiFi
  (2, 1), (2, 3), (2, 5),   -- Booking 2: Projector, Video Conferencing, WiFi
  (4, 1), (4, 3), (4, 5),   -- Booking 4: Projector, Video Conferencing, WiFi
  (7, 1), (7, 3), (7, 4), (7, 5), -- Booking 7: All amenities
  (8, 1), (8, 3), (8, 5),   -- Booking 8: Projector, Video Conferencing, WiFi
  (10, 1), (10, 5),         -- Booking 10: Projector, WiFi
  (12, 1), (12, 3), (12, 5), -- Booking 12: Projector, Video Conferencing, WiFi
  (15, 1), (15, 3), (15, 5); -- Booking 15: Projector, Video Conferencing, WiFi

