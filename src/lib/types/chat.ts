// 채팅 투표·정산 API 타입 (apps/chatting serializers)

/** A person as the room names them (nickname, real name or 익명N). */
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
    created_at: string;
}

// null counts and voters mean hidden results (future anonymous votes).
export interface ChatVoteOption {
    id: number;
    text: string;
    vote_count: number | null;
    voters: Sender[] | null;
}

export interface ChatVote {
    id: number;
    message_id: number;
    chat_room: number;
    title: string;
    max_choices: number | null;
    options: ChatVoteOption[];
    voter_count: number | null;
    my_option_ids: number[];
    created_at: string;
}

export interface ChatVoteCreateBody {
    chat_room: number;
    title: string;
    options: string[];
    max_choices: number | null;
}
