export interface Sender {
    display_name: string;
    anon_number: number | null;
    role: string;
    is_mine: boolean;
}

export interface ChatPaymentTarget {
    user: Sender;
    amount: number;
    paid_at: string | null;
    order_amount: number | null;
    delivery_fee_share: number | null;
}

export interface ChatPaymentRequest {
    id: number;
    message_id: number;
    chat_room: number;
    requester: Sender;
    bank_name: string;
    account_number: string;
    targets: ChatPaymentTarget[];
    total_amount: number;
    is_settled: boolean;
    canceled_at: string | null;
    created_at: string;
}

// Anonymous rooms (delivery included) name targets by anon_number, the others by user id.
export type ChatPaymentTargetRef = { anon_number: number } | { user: number };

export interface ChatPaymentCreateBody {
    chat_room: number;
    bank_name: string;
    account_number: string;
    targets: (ChatPaymentTargetRef & { amount: number })[];
}

export interface ChatVoteOption {
    id: number;
    text: string;
    vote_count: number;
    voters: Sender[];
}

export interface ChatVote {
    id: number;
    message_id: number;
    chat_room: number;
    title: string;
    max_choices: number | null;
    options: ChatVoteOption[];
    voter_count: number;
    my_option_ids: number[];
    created_at: string;
}

export interface ChatVoteCreateBody {
    chat_room: number;
    title: string;
    options: string[];
    max_choices: number | null;
}
