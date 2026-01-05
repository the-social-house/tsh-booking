-- Seed data for meeting_rooms table
-- All room names start with "Room of"

INSERT INTO meeting_rooms (meeting_room_name, meeting_room_slug, meeting_room_capacity, meeting_room_price_per_hour, meeting_room_size, meeting_room_images, meeting_room_description) VALUES
  ('Room of Innovation', 'room-of-innovation', 10, 50.00, 25.00, ARRAY['https://picsum.photos/400/300?random=1'], 'A modern space designed for forward-thinking teams. Perfect for brainstorming sessions and creative workshops.

The room features high-speed Wi-Fi, an interactive whiteboard, and video conferencing equipment. Natural lighting creates an inspiring atmosphere that enhances productivity and creativity.

Ideal for small to medium-sized teams looking to innovate and collaborate.'),
  ('Room of Collaboration', 'room-of-collaboration', 15, 75.00, 35.00, ARRAY['https://picsum.photos/400/300?random=2'], 'Spacious meeting room built for teamwork and group discussions. The open layout encourages active participation and idea sharing.

The space includes a large conference table, multiple display screens, and comfortable seating for 15 people. Whiteboard walls provide ample space for visual collaboration and note-taking.

Perfect for team meetings, workshops, and collaborative planning sessions.'),
  ('Room of Creativity', 'room-of-creativity', 8, 45.00, 20.00, ARRAY['https://picsum.photos/400/300?random=3'], 'An inspiring space designed to spark creativity and imagination. The vibrant atmosphere helps teams think outside the box.

The room offers flexible furniture arrangement, creative tools and supplies, and a sound system for presentations. Inspiring artwork and design elements throughout the space stimulate innovative thinking.

Great for design sessions, creative workshops, and innovative thinking.'),
  ('Room of Strategy', 'room-of-strategy', 20, 100.00, 50.00, ARRAY['https://picsum.photos/400/300?random=4'], 'Premium executive meeting space for strategic planning and high-level discussions. Professional environment with top-tier amenities.

The room provides executive seating for 20, advanced AV equipment, privacy features, and a premium refreshments area. Every detail is designed to support important business decisions.

Ideal for board meetings, strategic planning, and important client presentations.'),
  ('Room of Focus', 'room-of-focus', 6, 40.00, 15.00, ARRAY['https://picsum.photos/400/300?random=5'], 'A quiet, intimate space designed for deep work and focused discussions. Minimal distractions help teams concentrate on the task at hand.

The room features soundproofing, minimalist design, and high-quality lighting. Comfortable seating ensures you can work for extended periods without discomfort.

Perfect for one-on-one meetings, interviews, and focused work sessions.'),
  ('Room of Discovery', 'room-of-discovery', 12, 60.00, 30.00, ARRAY['https://picsum.photos/400/300?random=6'], 'Versatile meeting space perfect for exploring new ideas and discovering solutions. The flexible setup adapts to your needs.

The room includes modular furniture, multiple presentation options, and breakout areas. Natural and artificial lighting can be adjusted to create the perfect atmosphere for any type of meeting.

Excellent for training sessions, workshops, and exploratory meetings.'),
  ('Room of Excellence', 'room-of-excellence', 25, 125.00, 60.00, ARRAY['https://picsum.photos/400/300?random=7'], 'Our largest and most prestigious meeting space. Designed for excellence with premium features and spacious layout.

The room accommodates seating for 25+ people and features a state-of-the-art AV system with multiple presentation screens. A catering preparation area and executive lounge area make it perfect for extended meetings and special events.

Perfect for large team meetings, conferences, and special events.'),
  ('Room of Success', 'room-of-success', 18, 90.00, 45.00, ARRAY['https://picsum.photos/400/300?random=8'], 'A well-appointed meeting room that sets the stage for successful outcomes. Professional atmosphere with all the tools you need.

The room offers comfortable seating for 18, professional presentation equipment, and a high-quality audio system. A refreshment station ensures your team stays energized throughout the meeting.

Ideal for team meetings, client presentations, and project planning sessions.');

