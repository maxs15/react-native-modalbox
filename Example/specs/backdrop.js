export default function(spec) {
  spec.describe('Backdrop', function() {
    spec.it('opens when you press the button', async function() {
      await spec.press('Backdrop button');
      await spec.pause(1000);
      await spec.exists('Backdrop text');
    });

    spec.it('closes when you press the backdrop button', async function() {
      await spec.press('Backdrop button');
      await spec.pause(1000);
      await spec.press('Backdrop close button');
      await spec.pause(1000);
      await spec.notExists('Backdrop text');
    });
  });
}

