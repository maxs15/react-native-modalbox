export default function(spec) {

  spec.describe('Basic Modal', function() {
    spec.it('shows when the button is tapped', async function() {
      await spec.press('Basic modal button');
      await spec.pause(1000);
      await spec.exists('Basic modal text');
    });
  });
  
};
