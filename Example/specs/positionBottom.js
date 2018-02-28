export default function(spec) {
  spec.describe('Possition bottom + backdrop + slider', function() {
    spec.it('shows when the button is tapped', async function() {
      await spec.press('Position bottom button');
      await spec.pause(1000);
      await spec.exists('Position bottom text');
    });
  });
}
