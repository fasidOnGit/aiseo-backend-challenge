import { Router, Request, Response } from 'express';
import { getUserService } from './user-cache-singleton';
import { CreateUserRequest } from './types';

const userRouter: Router = Router();

userRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const userService = getUserService();
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users - Create new user
userRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userData: CreateUserRequest = req.body;

    // Basic validation
    if (!userData.name || !userData.email) {
      return res.status(400).json({
        error: 'Name and email are required',
      });
    }

    const userService = getUserService();
    const newUser = await userService.createUser(userData);

    res.status(201).json({ data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default userRouter;
