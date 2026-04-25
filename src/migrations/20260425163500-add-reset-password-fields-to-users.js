export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("users", "reset_password_token", {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.addColumn("users", "reset_password_expires", {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("users", "reset_password_expires");
  await queryInterface.removeColumn("users", "reset_password_token");
}
