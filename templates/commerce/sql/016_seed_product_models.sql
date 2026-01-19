-- Seed data for product_models: popular/common resell shoes.
-- Safe to run multiple times; uses ON CONFLICT (slug) DO NOTHING.

-- Nike
insert into product_models (brand, model, slug) values
  ('Nike', 'Air Force 1 Low', 'nike-air-force-1-low'),
  ('Nike', 'Air Force 1 Mid', 'nike-air-force-1-mid'),
  ('Nike', 'Air Force 1 High', 'nike-air-force-1-high'),
  ('Nike', 'Dunk Low', 'nike-dunk-low'),
  ('Nike', 'Dunk High', 'nike-dunk-high'),
  ('Nike', 'SB Dunk Low', 'nike-sb-dunk-low'),
  ('Nike', 'SB Dunk High', 'nike-sb-dunk-high'),
  ('Nike', 'Air Max 1', 'nike-air-max-1'),
  ('Nike', 'Air Max 90', 'nike-air-max-90'),
  ('Nike', 'Air Max 95', 'nike-air-max-95'),
  ('Nike', 'Air Max 97', 'nike-air-max-97'),
  ('Nike', 'Air Max Plus', 'nike-air-max-plus'),
  ('Nike', 'Air Max 270', 'nike-air-max-270'),
  ('Nike', 'Air Max 98', 'nike-air-max-98'),
  ('Nike', 'Blazer Mid 77', 'nike-blazer-mid-77'),
  ('Nike', 'Air Presto', 'nike-air-presto'),
  ('Nike', 'Air Huarache', 'nike-air-huarache'),
  ('Nike', 'Zoom Vomero 5', 'nike-zoom-vomero-5'),
  ('Nike', 'P-6000', 'nike-p-6000'),
  ('Nike', 'Cortez', 'nike-cortez')
on conflict (slug) do nothing;

-- Jordan
insert into product_models (brand, model, slug) values
  ('Jordan', 'Air Jordan 1 High', 'jordan-air-jordan-1-high'),
  ('Jordan', 'Air Jordan 1 Mid', 'jordan-air-jordan-1-mid'),
  ('Jordan', 'Air Jordan 1 Low', 'jordan-air-jordan-1-low'),
  ('Jordan', 'Air Jordan 3', 'jordan-air-jordan-3'),
  ('Jordan', 'Air Jordan 4', 'jordan-air-jordan-4'),
  ('Jordan', 'Air Jordan 5', 'jordan-air-jordan-5'),
  ('Jordan', 'Air Jordan 6', 'jordan-air-jordan-6'),
  ('Jordan', 'Air Jordan 11', 'jordan-air-jordan-11'),
  ('Jordan', 'Air Jordan 12', 'jordan-air-jordan-12'),
  ('Jordan', 'Air Jordan 13', 'jordan-air-jordan-13'),
  ('Jordan', 'Air Jordan 14', 'jordan-air-jordan-14')
on conflict (slug) do nothing;

-- Yeezy
insert into product_models (brand, model, slug) values
  ('Yeezy', 'Boost 350 V2', 'yeezy-boost-350-v2'),
  ('Yeezy', 'Boost 380', 'yeezy-boost-380'),
  ('Yeezy', 'Boost 700', 'yeezy-boost-700'),
  ('Yeezy', 'Boost 700 V2', 'yeezy-boost-700-v2'),
  ('Yeezy', 'Boost 700 V3', 'yeezy-boost-700-v3'),
  ('Yeezy', '500', 'yeezy-500'),
  ('Yeezy', '450', 'yeezy-450'),
  ('Yeezy', 'Foam Runner', 'yeezy-foam-runner'),
  ('Yeezy', 'Slide', 'yeezy-slide')
on conflict (slug) do nothing;

-- Adidas
insert into product_models (brand, model, slug) values
  ('Adidas', 'Samba', 'adidas-samba'),
  ('Adidas', 'Gazelle', 'adidas-gazelle'),
  ('Adidas', 'Campus 00s', 'adidas-campus-00s'),
  ('Adidas', 'Forum Low', 'adidas-forum-low'),
  ('Adidas', 'Forum High', 'adidas-forum-high'),
  ('Adidas', 'Superstar', 'adidas-superstar'),
  ('Adidas', 'Stan Smith', 'adidas-stan-smith'),
  ('Adidas', 'Ultraboost', 'adidas-ultraboost'),
  ('Adidas', 'NMD R1', 'adidas-nmd-r1'),
  ('Adidas', 'Handball Spezial', 'adidas-handball-spezial')
on conflict (slug) do nothing;

-- New Balance
insert into product_models (brand, model, slug) values
  ('New Balance', '550', 'new-balance-550'),
  ('New Balance', '2002R', 'new-balance-2002r'),
  ('New Balance', '1906R', 'new-balance-1906r'),
  ('New Balance', '9060', 'new-balance-9060'),
  ('New Balance', '990v3', 'new-balance-990v3'),
  ('New Balance', '990v4', 'new-balance-990v4'),
  ('New Balance', '990v5', 'new-balance-990v5'),
  ('New Balance', '990v6', 'new-balance-990v6'),
  ('New Balance', '992', 'new-balance-992'),
  ('New Balance', '993', 'new-balance-993'),
  ('New Balance', '327', 'new-balance-327'),
  ('New Balance', '530', 'new-balance-530'),
  ('New Balance', '574', 'new-balance-574')
on conflict (slug) do nothing;

-- ASICS
insert into product_models (brand, model, slug) values
  ('ASICS', 'Gel-Kayano 14', 'asics-gel-kayano-14'),
  ('ASICS', 'Gel-1130', 'asics-gel-1130'),
  ('ASICS', 'Gel-Nimbus 9', 'asics-gel-nimbus-9'),
  ('ASICS', 'Gel-Lyte III', 'asics-gel-lyte-iii')
on conflict (slug) do nothing;

-- Salomon
insert into product_models (brand, model, slug) values
  ('Salomon', 'XT-6', 'salomon-xt-6'),
  ('Salomon', 'XT-4', 'salomon-xt-4'),
  ('Salomon', 'ACS Pro', 'salomon-acs-pro'),
  ('Salomon', 'Speedcross 5', 'salomon-speedcross-5')
on conflict (slug) do nothing;

-- Converse
insert into product_models (brand, model, slug) values
  ('Converse', 'Chuck 70', 'converse-chuck-70'),
  ('Converse', 'Chuck Taylor All Star', 'converse-chuck-taylor-all-star'),
  ('Converse', 'One Star', 'converse-one-star')
on conflict (slug) do nothing;

-- Vans
insert into product_models (brand, model, slug) values
  ('Vans', 'Old Skool', 'vans-old-skool'),
  ('Vans', 'Sk8-Hi', 'vans-sk8-hi'),
  ('Vans', 'Authentic', 'vans-authentic'),
  ('Vans', 'Slip-On', 'vans-slip-on')
on conflict (slug) do nothing;

-- Reebok
insert into product_models (brand, model, slug) values
  ('Reebok', 'Club C 85', 'reebok-club-c-85'),
  ('Reebok', 'Classic Leather', 'reebok-classic-leather'),
  ('Reebok', 'Question Mid', 'reebok-question-mid')
on conflict (slug) do nothing;

-- Puma
insert into product_models (brand, model, slug) values
  ('Puma', 'Suede Classic', 'puma-suede-classic'),
  ('Puma', 'RS-X', 'puma-rs-x'),
  ('Puma', 'Slipstream', 'puma-slipstream')
on conflict (slug) do nothing;

-- Crocs
insert into product_models (brand, model, slug) values
  ('Crocs', 'Classic Clog', 'crocs-classic-clog'),
  ('Crocs', 'Echo Clog', 'crocs-echo-clog')
on conflict (slug) do nothing;

-- Birkenstock
insert into product_models (brand, model, slug) values
  ('Birkenstock', 'Boston', 'birkenstock-boston'),
  ('Birkenstock', 'Arizona', 'birkenstock-arizona')
on conflict (slug) do nothing;

-- UGG
insert into product_models (brand, model, slug) values
  ('UGG', 'Tasman', 'ugg-tasman'),
  ('UGG', 'Classic Mini', 'ugg-classic-mini')
on conflict (slug) do nothing;

-- Additional Nike models
insert into product_models (brand, model, slug) values
  ('Nike', 'Air Max 180', 'nike-air-max-180'),
  ('Nike', 'Air Max 93', 'nike-air-max-93'),
  ('Nike', 'Air VaporMax', 'nike-air-vapormax'),
  ('Nike', 'Air Zoom Spiridon', 'nike-air-zoom-spiridon'),
  ('Nike', 'Shox TL', 'nike-shox-tl'),
  ('Nike', 'Shox R4', 'nike-shox-r4'),
  ('Nike', 'Kobe 4 Protro', 'nike-kobe-4-protro'),
  ('Nike', 'Kobe 5 Protro', 'nike-kobe-5-protro'),
  ('Nike', 'Kobe 6 Protro', 'nike-kobe-6-protro'),
  ('Nike', 'Kobe 8 Protro', 'nike-kobe-8-protro')
on conflict (slug) do nothing;

-- Additional Jordan models
insert into product_models (brand, model, slug) values
  ('Jordan', 'Air Jordan 2', 'jordan-air-jordan-2'),
  ('Jordan', 'Air Jordan 7', 'jordan-air-jordan-7'),
  ('Jordan', 'Air Jordan 8', 'jordan-air-jordan-8'),
  ('Jordan', 'Air Jordan 9', 'jordan-air-jordan-9'),
  ('Jordan', 'Air Jordan 10', 'jordan-air-jordan-10'),
  ('Jordan', 'Air Jordan 11 Low', 'jordan-air-jordan-11-low')
on conflict (slug) do nothing;

-- Additional Adidas models
insert into product_models (brand, model, slug) values
  ('Adidas', 'Ozweego', 'adidas-ozweego'),
  ('Adidas', 'ZX 8000', 'adidas-zx-8000'),
  ('Adidas', 'Response CL', 'adidas-response-cl'),
  ('Adidas', 'Rivalry Low', 'adidas-rivalry-low'),
  ('Adidas', 'Adilette 22', 'adidas-adilette-22'),
  ('Adidas', 'Adilette', 'adidas-adilette')
on conflict (slug) do nothing;

-- Additional New Balance models
insert into product_models (brand, model, slug) values
  ('New Balance', '650R', 'new-balance-650r'),
  ('New Balance', '991', 'new-balance-991'),
  ('New Balance', '991v2', 'new-balance-991v2'),
  ('New Balance', '996', 'new-balance-996'),
  ('New Balance', '997', 'new-balance-997'),
  ('New Balance', '998', 'new-balance-998'),
  ('New Balance', '990v1', 'new-balance-990v1'),
  ('New Balance', '990v2', 'new-balance-990v2'),
  ('New Balance', '580', 'new-balance-580')
on conflict (slug) do nothing;

-- Additional ASICS models
insert into product_models (brand, model, slug) values
  ('ASICS', 'GT-2160', 'asics-gt-2160'),
  ('ASICS', 'Gel-Lyte V', 'asics-gel-lyte-v'),
  ('ASICS', 'Gel-Kayano 5 OG', 'asics-gel-kayano-5-og')
on conflict (slug) do nothing;

-- Additional Salomon models
insert into product_models (brand, model, slug) values
  ('Salomon', 'XA Pro 3D', 'salomon-xa-pro-3d'),
  ('Salomon', 'XT-Quest 2', 'salomon-xt-quest-2')
on conflict (slug) do nothing;

-- Additional Converse models
insert into product_models (brand, model, slug) values
  ('Converse', 'Run Star Hike', 'converse-run-star-hike')
on conflict (slug) do nothing;

-- Additional Vans models
insert into product_models (brand, model, slug) values
  ('Vans', 'Era', 'vans-era'),
  ('Vans', 'Half Cab', 'vans-half-cab')
on conflict (slug) do nothing;

-- Additional Reebok models
insert into product_models (brand, model, slug) values
  ('Reebok', 'Instapump Fury', 'reebok-instapump-fury'),
  ('Reebok', 'Answer IV', 'reebok-answer-iv')
on conflict (slug) do nothing;

-- Additional Puma models
insert into product_models (brand, model, slug) values
  ('Puma', 'Clyde', 'puma-clyde'),
  ('Puma', 'Palermo', 'puma-palermo')
on conflict (slug) do nothing;

-- Additional Crocs models
insert into product_models (brand, model, slug) values
  ('Crocs', 'All-Terrain Clog', 'crocs-all-terrain-clog')
on conflict (slug) do nothing;

-- Additional Birkenstock models
insert into product_models (brand, model, slug) values
  ('Birkenstock', 'Tokio', 'birkenstock-tokio')
on conflict (slug) do nothing;

-- Additional UGG models
insert into product_models (brand, model, slug) values
  ('UGG', 'Classic Ultra Mini', 'ugg-classic-ultra-mini'),
  ('UGG', 'Tazz', 'ugg-tazz')
on conflict (slug) do nothing;

-- Hoka
insert into product_models (brand, model, slug) values
  ('Hoka', 'Clifton 9', 'hoka-clifton-9'),
  ('Hoka', 'Bondi 8', 'hoka-bondi-8'),
  ('Hoka', 'Speedgoat 5', 'hoka-speedgoat-5'),
  ('Hoka', 'Mafate Speed 4', 'hoka-mafate-speed-4')
on conflict (slug) do nothing;

-- On
insert into product_models (brand, model, slug) values
  ('On', 'Cloud 5', 'on-cloud-5'),
  ('On', 'Cloudmonster', 'on-cloudmonster'),
  ('On', 'Cloudnova', 'on-cloudnova'),
  ('On', 'Cloudsurfer', 'on-cloudsurfer')
on conflict (slug) do nothing;

-- Saucony
insert into product_models (brand, model, slug) values
  ('Saucony', 'Shadow 6000', 'saucony-shadow-6000'),
  ('Saucony', 'Jazz Original', 'saucony-jazz-original'),
  ('Saucony', 'Grid 9000', 'saucony-grid-9000'),
  ('Saucony', 'ProGrid Triumph 4', 'saucony-progrid-triumph-4')
on conflict (slug) do nothing;

-- Mizuno
insert into product_models (brand, model, slug) values
  ('Mizuno', 'Wave Rider 10', 'mizuno-wave-rider-10'),
  ('Mizuno', 'Wave Prophecy LS', 'mizuno-wave-prophecy-ls')
on conflict (slug) do nothing;

-- Timberland
insert into product_models (brand, model, slug) values
  ('Timberland', '6-Inch Premium Boot', 'timberland-6-inch-premium-boot'),
  ('Timberland', '3-Eye Lug Shoe', 'timberland-3-eye-lug-shoe')
on conflict (slug) do nothing;

-- Dr Martens
insert into product_models (brand, model, slug) values
  ('Dr Martens', '1460 Boot', 'dr-martens-1460-boot'),
  ('Dr Martens', '1461 Shoe', 'dr-martens-1461-shoe')
on conflict (slug) do nothing;

-- Nike basketball and heritage additions
insert into product_models (brand, model, slug) values
  ('Nike', 'LeBron 9', 'nike-lebron-9'),
  ('Nike', 'LeBron 10', 'nike-lebron-10'),
  ('Nike', 'LeBron 15', 'nike-lebron-15'),
  ('Nike', 'KD 7', 'nike-kd-7'),
  ('Nike', 'KD 8', 'nike-kd-8'),
  ('Nike', 'KD 9', 'nike-kd-9'),
  ('Nike', 'Foamposite One', 'nike-foamposite-one'),
  ('Nike', 'Foamposite Pro', 'nike-foamposite-pro'),
  ('Nike', 'Blazer Low 77', 'nike-blazer-low-77')
on conflict (slug) do nothing;

-- Converse collaborations
insert into product_models (brand, model, slug) values
  ('Converse', 'Chuck Taylor All Star CDG Play', 'converse-chuck-taylor-all-star-cdg-play')
on conflict (slug) do nothing;
