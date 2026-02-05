-- Ensure email message identity uniqueness within an account
create unique index if not exists idx_email_messages_account_message_id_unique
  on email_messages (account_id, message_id)
  where message_id is not null;

create unique index if not exists idx_email_messages_account_provider_mailbox_unique
  on email_messages (account_id, provider_id, mailbox)
  where provider_id is not null;
