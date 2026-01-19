create or replace function create_variant_with_sku(
  product_id_input uuid,
  brand_input text,
  model_input text,
  size_input text,
  condition_input text,
  price_input integer,
  stock_input integer
)
returns uuid
language plpgsql
as $$
declare
  generated_sku text;
  variant_id uuid;
begin
  -- Generate SKU
  generated_sku := generate_sku(brand_input, model_input, size_input, condition_input);

  -- Insert variant
  insert into product_variants (
    product_id,
    brand,
    model,
    size,
    condition,
    condition_code,
    sku,
    price_cents,
    stock
  ) values (
    product_id_input,
    brand_input,
    model_input,
    size_input,
    case
      when condition_input = 'DS' then 'Deadstock'
      when condition_input = 'VNDS' then 'Very Near Deadstock'
      when condition_input = 'USED' then 'Used'
      else condition_input
    end,
    condition_input,
    generated_sku,
    price_input,
    stock_input
  )
  returning id into variant_id;

  return variant_id;
end;
$$;