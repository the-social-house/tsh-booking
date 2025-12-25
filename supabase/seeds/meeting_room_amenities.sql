-- Seed data for meeting_room_amenities table
-- Linking amenities to meeting rooms
-- Uses subqueries to get UUIDs by name

INSERT INTO meeting_room_amenities (meeting_room_id, amenity_id) VALUES
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Innovation'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Projector')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Innovation'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Whiteboard')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Innovation'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Collaboration'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Projector')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Collaboration'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Video Conferencing')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Collaboration'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Creativity'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Whiteboard')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Creativity'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Strategy'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Projector')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Strategy'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Video Conferencing')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Strategy'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Focus'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Whiteboard')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Focus'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Discovery'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Projector')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Discovery'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Whiteboard')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Discovery'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Excellence'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Projector')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Excellence'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Video Conferencing')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Excellence'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Catering')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Excellence'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Success'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Projector')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Success'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'Video Conferencing')),
  ((SELECT meeting_room_id FROM meeting_rooms WHERE meeting_room_name = 'Room of Success'), (SELECT amenity_id FROM amenities WHERE amenity_name = 'WiFi'));

