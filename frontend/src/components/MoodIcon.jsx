import { Frown, Annoyed, Meh, Smile, Laugh } from 'lucide-react';

function MoodIcon({ moodValue, size = 20 }) {
  switch (moodValue) {
    case 1:
      return <Frown size={size} />;
    case 2:
      return <Annoyed size={size} />;
    case 3:
      return <Meh size={size} />;
    case 4:
      return <Smile size={size} />;
    case 5:
      return <Laugh size={size} />;
    default:
      return <Meh size={size} />;
  }
}

export default MoodIcon;
