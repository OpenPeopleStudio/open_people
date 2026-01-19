create or replace function generate_sku(
  brand_input text,
  model_input text,
  size_input text,
  condition_input text
)
returns text
language plpgsql
as $$
declare
  base text;
  hash text;
begin
  base := upper(brand_input)
          || '-' || upper(model_input)
          || '-' || upper(size_input)
          || '-' || upper(condition_input);

  hash := substr(md5(base || now()::text), 1, 4);

  return base || '-' || upper(hash);
end;
$$;