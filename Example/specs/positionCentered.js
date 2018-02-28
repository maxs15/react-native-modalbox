export default function(spec) {
  spec.describe('Position centered + backdrop + disable', function() {
    spec.it('shows when the button is tapped', async function() {
      await spec.press('Position centered button');
      await spec.pause(1000);
      await spec.exists('Position centered text');
    });
  });
}
