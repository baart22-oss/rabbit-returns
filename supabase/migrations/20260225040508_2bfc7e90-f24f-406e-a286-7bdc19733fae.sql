
-- Create storage bucket for proof of payment uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-of-payment', 'proof-of-payment', false);

-- Allow authenticated users to upload their own proof of payment
CREATE POLICY "Users can upload own proof" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proof-of-payment' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own uploads
CREATE POLICY "Users can view own proof" ON storage.objects FOR SELECT USING (bucket_id = 'proof-of-payment' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to view all proof of payment files
CREATE POLICY "Admins can view all proof" ON storage.objects FOR SELECT USING (bucket_id = 'proof-of-payment' AND public.has_role(auth.uid(), 'admin'));
