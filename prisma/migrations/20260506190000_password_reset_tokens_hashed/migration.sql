-- Tokens antigos eram armazenados em texto puro; após passar a usar SHA-256, invalide-os.
DELETE FROM "PasswordResetToken";
