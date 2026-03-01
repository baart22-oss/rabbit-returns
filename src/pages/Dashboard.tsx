// Updated functions to use withdrawal_requests table with investment_id

import { supabase } from '../lib/supabaseClient';

// Function to request withdrawal using withdrawal_requests table
export const requestWithdrawal = async (userId, amount, investmentId) => {
    const { data, error } = await supabase.from('withdrawal_requests').insert([{ user_id: userId, amount, investment_id: investmentId }]);
    return { data, error };
};

// Function to request bonus withdrawal using withdrawal_requests table
export const requestBonusWithdrawal = async (userId, bonusAmount, investmentId) => {
    const { data, error } = await supabase.from('withdrawal_requests').insert([{ user_id: userId, amount: bonusAmount, investment_id: investmentId }]);
    return { data, error };
};