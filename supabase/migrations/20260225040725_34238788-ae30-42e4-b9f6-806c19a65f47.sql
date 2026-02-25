
-- Function to calculate referral commissions when investment becomes active
CREATE OR REPLACE FUNCTION public.calculate_referral_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  investor_referred_by text;
  level1_user_id uuid;
  level2_user_id uuid;
  level3_user_id uuid;
  commission_rates numeric[] := ARRAY[0.05, 0.03, 0.01];
  current_referral_code text;
BEGIN
  -- Only trigger when status changes to 'active'
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    -- Get the referral code that referred this investor
    SELECT referred_by INTO current_referral_code
    FROM public.profiles WHERE user_id = NEW.user_id;

    -- Level 1: direct referrer
    IF current_referral_code IS NOT NULL THEN
      SELECT user_id INTO level1_user_id
      FROM public.profiles WHERE referral_code = current_referral_code;

      IF level1_user_id IS NOT NULL THEN
        INSERT INTO public.referral_commissions (user_id, from_user_id, investment_id, level, rate, amount, status)
        VALUES (level1_user_id, NEW.user_id, NEW.id, 1, commission_rates[1], NEW.amount * commission_rates[1], 'pending');

        -- Level 2: referrer's referrer
        SELECT referred_by INTO current_referral_code
        FROM public.profiles WHERE user_id = level1_user_id;

        IF current_referral_code IS NOT NULL THEN
          SELECT user_id INTO level2_user_id
          FROM public.profiles WHERE referral_code = current_referral_code;

          IF level2_user_id IS NOT NULL THEN
            INSERT INTO public.referral_commissions (user_id, from_user_id, investment_id, level, rate, amount, status)
            VALUES (level2_user_id, NEW.user_id, NEW.id, 2, commission_rates[2], NEW.amount * commission_rates[2], 'pending');

            -- Level 3
            SELECT referred_by INTO current_referral_code
            FROM public.profiles WHERE user_id = level2_user_id;

            IF current_referral_code IS NOT NULL THEN
              SELECT user_id INTO level3_user_id
              FROM public.profiles WHERE referral_code = current_referral_code;

              IF level3_user_id IS NOT NULL THEN
                INSERT INTO public.referral_commissions (user_id, from_user_id, investment_id, level, rate, amount, status)
                VALUES (level3_user_id, NEW.user_id, NEW.id, 3, commission_rates[3], NEW.amount * commission_rates[3], 'pending');
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on investments table
CREATE TRIGGER on_investment_activated
  AFTER UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_referral_commissions();
