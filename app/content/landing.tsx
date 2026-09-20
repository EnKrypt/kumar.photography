import type { Landing } from '~/lib/types';

export const landing: Landing = {
  title: {
    node: (
      <>
        <span className="title-first">arvind</span>{' '}
        <span className="title-last">kumar</span>
      </>
    ),
    subtitle: <>bird photography</>,
    image: '2026-09-06-pied-bushchat',
    overlay: 'right'
  },
  images: [
    '2026-08-23-asian-green-bee-eater-2',
    '2026-08-23-rose-ringed-parakeet',
    '2026-08-23-tickells-blue-flycatcher',
    '2026-08-16-pale-billed-flowerpecker-1',
    '2026-08-16-yellow-billed-babbler-1',
    '2026-08-16-blue-faced-malkoha',
    '2026-08-09-little-egret'
  ]
};
