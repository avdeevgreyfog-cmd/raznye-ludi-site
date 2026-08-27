# Responsive rules

Target widths: 360, 390, 768, 1024, 1440, 1920.

## Mobile art direction
- hero copy moves to lower safe zone; background crop shifts independently;
- primary actions become full-width;
- event rows collapse to one column;
- equipment visual loses sticky behavior and uses a shorter crop;
- split sections become image-first single column;
- large headings use viewport-aware clamps without horizontal clipping.

## Release checks
No horizontal overflow, clipped headings, hidden navigation, offscreen CTA, unusable touch targets or faces/subjects covered by text.