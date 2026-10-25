const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassRoomStudent = sequelize.define('ClassRoomStudent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  classRoomId: { type: DataTypes.UUID, allowNull: false },
  studentId: { type: DataTypes.UUID, allowNull: false },
  joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'classroom_students',
  timestamps: false,
});

module.exports = ClassRoomStudent;
