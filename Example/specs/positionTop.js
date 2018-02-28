export default function(spec) {
  spec.describe('Position top', function() {
    spec.it('shows when the button is tapped', async function() {
      await spec.press('Position top button');
      await spec.pause(1000);
      await spec.exists('Position top text');
    });
  });
}
