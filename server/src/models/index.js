const sequelize = require('../config/database');
const User = require('./User');
const Question = require('./Question');
const GameSession = require('./GameSession');
const GameSessionPlayer = require('./GameSessionPlayer');
const Subscription = require('./Subscription');
const ShopItem = require('./ShopItem');
const UserShopItem = require('./UserShopItem');
const ClassRoom = require('./ClassRoom');
const ClassRoomStudent = require('./ClassRoomStudent');

// Associations
User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(GameSessionPlayer, { foreignKey: 'userId' });
GameSessionPlayer.belongsTo(User, { foreignKey: 'userId' });

GameSession.hasMany(GameSessionPlayer, { foreignKey: 'gameSessionId' });
GameSessionPlayer.belongsTo(GameSession, { foreignKey: 'gameSessionId' });

User.belongsToMany(ShopItem, { through: UserShopItem, foreignKey: 'userId' });
ShopItem.belongsToMany(User, { through: UserShopItem, foreignKey: 'shopItemId' });

User.hasMany(ClassRoom, { foreignKey: 'teacherId', as: 'ownedClassrooms' });
ClassRoom.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

User.belongsToMany(ClassRoom, { through: ClassRoomStudent, foreignKey: 'studentId', as: 'classrooms' });
ClassRoom.belongsToMany(User, { through: ClassRoomStudent, foreignKey: 'classRoomId', as: 'students' });

module.exports = {
  sequelize,
  User,
  Question,
  GameSession,
  GameSessionPlayer,
  Subscription,
  ShopItem,
  UserShopItem,
  ClassRoom,
  ClassRoomStudent,
};
