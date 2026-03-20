-- System-generated notifications (RLS has no client INSERT on notifications).

create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  seller uuid;
  status_label_he text;
  status_label_en text;
begin
  if tg_op = 'INSERT' and new.status = 'requested' then
    select s.seller_id into seller from public.shops s where s.id = new.shop_id limit 1;
    if seller is not null then
      insert into public.notifications (user_id, type, title_he, title_en, body_he, body_en, data)
      values (
        seller,
        'order_update',
        'הזמנה חדשה',
        'New order',
        'יש בקשת הזמנה חדשה למוצר שלך',
        'You have a new order request',
        jsonb_build_object('order_id', new.id::text, 'status', new.status::text)
      );
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and (old.status is distinct from new.status) then
    select s.seller_id into seller from public.shops s where s.id = new.shop_id limit 1;

    status_label_he := case new.status
      when 'requested' then 'ממתין'
      when 'accepted' then 'אושר'
      when 'rejected' then 'נדחה'
      when 'paid' then 'שולם'
      when 'delivered' then 'נמסר'
      when 'cancelled' then 'בוטל'
      else new.status::text
    end;
    status_label_en := initcap(replace(new.status::text, '_', ' '));

    insert into public.notifications (user_id, type, title_he, title_en, body_he, body_en, data)
    values (
      new.consumer_id,
      'order_update',
      'עדכון הזמנה',
      'Order update',
      'סטטוס ההזמנה: ' || status_label_he,
      'Your order status is now: ' || status_label_en,
      jsonb_build_object('order_id', new.id::text, 'status', new.status::text)
    );

    if seller is not null then
      insert into public.notifications (user_id, type, title_he, title_en, body_he, body_en, data)
      values (
        seller,
        'order_update',
        'עדכון הזמנה',
        'Order update',
        'הזמנה חדשה או שינוי סטטוס: ' || status_label_he,
        'Order status: ' || status_label_en,
        jsonb_build_object('order_id', new.id::text, 'status', new.status::text)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_insert_notify on public.orders;
create trigger on_order_insert_notify
  after insert on public.orders
  for each row
  execute function public.notify_order_status_change();

drop trigger if exists on_order_status_notify on public.orders;
create trigger on_order_status_notify
  after update of status on public.orders
  for each row
  execute function public.notify_order_status_change();

create or replace function public.notify_application_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and (old.status is distinct from new.status)
     and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, type, title_he, title_en, body_he, body_en, data)
    values (
      new.user_id,
      'application_decision',
      case when new.status = 'approved' then 'בקשת המוכר אושרה' else 'בקשת המוכר נדחתה' end,
      case when new.status = 'approved' then 'Seller application approved' else 'Seller application rejected' end,
      coalesce(new.admin_note, ''),
      coalesce(new.admin_note, ''),
      jsonb_build_object('application_id', new.id::text, 'status', new.status::text)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_application_status_notify on public.seller_applications;
create trigger on_application_status_notify
  after update of status on public.seller_applications
  for each row
  execute function public.notify_application_decision();
