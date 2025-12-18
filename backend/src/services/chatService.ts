import { query } from '../config/database';
import { ChatChannel, ChatMessage, ChatChannelType } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getChatChannels = async (userId: string): Promise<ChatChannel[]> => {
  const result = await query(
    `SELECT DISTINCT c.id, c.name, c.type, c.team_id, c.project_id, c.created_at
     FROM chat_channels c
     INNER JOIN chat_channel_participants cp ON c.id = cp.channel_id
     WHERE cp.user_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );

  const channels = result.rows.map(mapChannelFromDb);

  for (const channel of channels) {
    const participants = await getChannelParticipants(channel.id);
    channel.participants = participants;

    const unreadCount = await getUnreadCount(channel.id, userId);
    channel.unreadCount = unreadCount;
  }

  return channels;
};

export const getChannelById = async (channelId: string): Promise<ChatChannel> => {
  const result = await query(
    'SELECT id, name, type, team_id, project_id, created_at FROM chat_channels WHERE id = $1',
    [channelId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Channel not found');
  }

  const channel = mapChannelFromDb(result.rows[0]);
  channel.participants = await getChannelParticipants(channelId);

  return channel;
};

export const createChannel = async (data: {
  name?: string;
  type: ChatChannelType;
  teamId?: string;
  projectId?: string;
  participantIds: string[];
}): Promise<ChatChannel> => {
  const { name, type, teamId, projectId, participantIds } = data;

  const channelResult = await query(
    `INSERT INTO chat_channels (name, type, team_id, project_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, type, team_id, project_id, created_at`,
    [name, type, teamId, projectId]
  );

  const channel = channelResult.rows[0];

  for (const userId of participantIds) {
    await query(
      'INSERT INTO chat_channel_participants (channel_id, user_id) VALUES ($1, $2)',
      [channel.id, userId]
    );
  }

  return mapChannelFromDb(channel);
};

export const getMessages = async (channelId: string, limit: number = 50): Promise<ChatMessage[]> => {
  const result = await query(
    `SELECT m.id, m.content, m.sender_id, m.channel_id, m.created_at, m.is_read,
            u.id as user_id, u.name, u.email, u.avatar, u.role, u.created_at as user_created_at
     FROM chat_messages m
     INNER JOIN users u ON m.sender_id = u.id
     WHERE m.channel_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2`,
    [channelId, limit]
  );

  return result.rows.reverse().map(mapMessageFromDb);
};

export const sendMessage = async (data: {
  channelId: string;
  senderId: string;
  content: string;
}): Promise<ChatMessage> => {
  const { channelId, senderId, content } = data;

  const result = await query(
    `INSERT INTO chat_messages (channel_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, channel_id, sender_id, content, is_read, created_at`,
    [channelId, senderId, content]
  );

  const message = result.rows[0];

  const userResult = await query(
    'SELECT id, name, email, avatar, role, created_at FROM users WHERE id = $1',
    [senderId]
  );

  if (userResult.rows.length > 0) {
    message.sender = userResult.rows[0];
  }

  return mapMessageFromDb(message);
};

export const markMessagesAsRead = async (channelId: string, userId: string): Promise<void> => {
  await query(
    `UPDATE chat_messages SET is_read = true
     WHERE channel_id = $1 AND sender_id != $2 AND is_read = false`,
    [channelId, userId]
  );
};

const getChannelParticipants = async (channelId: string) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.avatar, u.role, u.created_at
     FROM users u
     INNER JOIN chat_channel_participants cp ON u.id = cp.user_id
     WHERE cp.channel_id = $1`,
    [channelId]
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  }));
};

const getUnreadCount = async (channelId: string, userId: string): Promise<number> => {
  const result = await query(
    'SELECT COUNT(*) FROM chat_messages WHERE channel_id = $1 AND sender_id != $2 AND is_read = false',
    [channelId, userId]
  );

  return parseInt(result.rows[0].count);
};

const mapChannelFromDb = (row: any): ChatChannel => ({
  id: row.id,
  name: row.name,
  type: row.type,
  teamId: row.team_id,
  projectId: row.project_id,
  createdAt: row.created_at,
});

const mapMessageFromDb = (row: any): ChatMessage => {
  const message: ChatMessage = {
    id: row.id,
    content: row.content,
    senderId: row.sender_id,
    channelId: row.channel_id,
    createdAt: row.created_at,
    isRead: row.is_read,
  };

  if (row.user_id) {
    message.sender = {
      id: row.user_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role,
      createdAt: row.user_created_at,
      updatedAt: row.user_created_at,
    };
  }

  return message;
};