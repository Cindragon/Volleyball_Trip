import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { isChunkLoadError, reloadForNewBuild } from '../utils/chunkReload';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render errors (including failed lazy page loads) so the app never goes blank. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error) && reloadForNewBuild()) return;
    console.error('[VolleyTrip] Unhandled render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isUpdate = isChunkLoadError(error);
    return (
      <Box role="alert" sx={{ maxWidth: 480, mx: 'auto', my: 10, px: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {isUpdate ? 'A new version is available' : 'Something went wrong'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isUpdate
            ? 'VolleyTrip was updated while this page was open. Reload to continue.'
            : 'This page hit an unexpected error. Reloading usually fixes it.'}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>Reload</Button>
      </Box>
    );
  }
}
