import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Call = ({ callLogs = [] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                width: '100%',
                height: isMobile ? 'calc(100vh - 120px)' : '100%',
                p: 2,
                overflowY: 'auto',
                bgcolor: '#fff6f8',
                fontFamily: 'Poppins, sans-serif',
            }}
        >
            <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, textAlign: isMobile ? 'center' : 'left' }}
            >
                Call Logs
            </Typography>

            <List>
                {callLogs.length === 0 && (
                  <Typography sx={{ color: '#888', textAlign: 'center', mt: 4 }}>
                    No call logs yet.
                  </Typography>
                )}
                {callLogs.map((log, index) => (
                    <ListItem
                        key={log.id || index}
                        sx={{
                            bgcolor: '#fff',
                            borderRadius: 3,
                            mb: 1,
                            boxShadow: '0px 2px 8px rgba(0,0,0,0.03)',
                            px: 2,
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar src={log.image} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography sx={{ fontWeight: 600 }}>
                                    {log.name}
                                </Typography>
                            }
                            secondary={
                                <Typography
                                    sx={{
                                        fontSize: '0.85rem',
                                        color:
                                          log.type === 'missed'
                                            ? '#f44336'
                                            : log.type === 'incoming'
                                            ? '#4caf50'
                                            : '#1976d2',
                                    }}
                                >
                                    {log.type === 'missed'
                                      ? 'Missed Call'
                                      : log.type === 'incoming'
                                      ? 'Incoming Call'
                                      : 'Outgoing Call'}{' '}
                                    • {log.time}
                                </Typography>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default Call;
