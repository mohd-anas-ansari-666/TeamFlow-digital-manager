import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as chatService from '../services/chatService';

export const getChatChannels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const channels = await chatService.getChatChannels(req.user!.id);
    res.json(channels);
  } catch (error) {
    next(error);
  }
};

export const getChannelById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const channel = await chatService.getChannelById(req.params.id);
    res.json(channel);
  } catch (error) {
    next(error);
  }
};

export const createChannel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const channel = await chatService.createChannel(req.body);
    res.status(201).json(channel);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const messages = await chatService.getMessages(channelId, limit);
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { channelId, content } = req.body;
    const message = await chatService.sendMessage({
      channelId,
      senderId: req.user!.id,
      content,
    });
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    await chatService.markMessagesAsRead(channelId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};