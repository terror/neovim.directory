import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';

export const LoadingIndicator = ({ text }: { text: string }) => {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='flex flex-col items-center gap-4'
      >
        <Spinner size='lg' />
        <p className='text-muted-foreground text-lg'>{text}</p>
      </motion.div>
    </div>
  );
};
