--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: test; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA test;


ALTER SCHEMA test OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: backups; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.backups (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    size bigint NOT NULL,
    description text
);


ALTER TABLE test.backups OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.backups_id_seq OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: postgres
--

ALTER SEQUENCE test.backups_id_seq OWNED BY test.backups.id;


--
-- Name: bank_pool; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.bank_pool (
    id bigint NOT NULL,
    bank_transaction character varying(20) NOT NULL,
    bank_type character varying(20) NOT NULL,
    bank_amount numeric(11,2) NOT NULL,
    transaction_when timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bank_real_amount numeric(11,2) NOT NULL
);


ALTER TABLE test.bank_pool OWNER TO postgres;

--
-- Name: channels; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.channels (
    id bigint NOT NULL,
    channel_name character varying(256),
    channel_id bigint NOT NULL,
    channel_link character varying(256) NOT NULL
);


ALTER TABLE test.channels OWNER TO postgres;

--
-- Name: donate; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.donate (
    id bigint NOT NULL,
    donate_name character varying(50) NOT NULL,
    donate_description character varying(500),
    donate_goal integer NOT NULL,
    donate_filled integer DEFAULT 0 NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    donate_id integer NOT NULL
);


ALTER TABLE test.donate OWNER TO postgres;

--
-- Name: donate_donate_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.donate_donate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.donate_donate_id_seq OWNER TO postgres;

--
-- Name: donate_donate_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: postgres
--

ALTER SEQUENCE test.donate_donate_id_seq OWNED BY test.donate.donate_id;


--
-- Name: donate_pool; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.donate_pool (
    id bigint NOT NULL,
    donate_id integer NOT NULL,
    donate_amount integer NOT NULL,
    transaction_when timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    donate_name character varying(50)
);


ALTER TABLE test.donate_pool OWNER TO postgres;

--
-- Name: gift_pool; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.gift_pool (
    gift_id bigint NOT NULL,
    message character varying(200),
    sub_id integer,
    sub_period integer,
    owner_id bigint NOT NULL,
    taker_id bigint,
    visible boolean DEFAULT true,
    gift_creates timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    gift_sent timestamp without time zone
);


ALTER TABLE test.gift_pool OWNER TO postgres;

--
-- Name: gift_pool_gift_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.gift_pool_gift_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.gift_pool_gift_id_seq OWNER TO postgres;

--
-- Name: gift_pool_gift_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: postgres
--

ALTER SEQUENCE test.gift_pool_gift_id_seq OWNED BY test.gift_pool.gift_id;


--
-- Name: merchant_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.merchant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.merchant_id_seq OWNER TO postgres;

--
-- Name: merchant; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.merchant (
    id bigint DEFAULT nextval('test.merchant_id_seq'::regclass) NOT NULL,
    merchant_name character varying(50)
);


ALTER TABLE test.merchant OWNER TO postgres;

--
-- Name: salary; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.salary (
    id bigint NOT NULL,
    salary_day integer DEFAULT 1 NOT NULL,
    salary_props character varying(500) NOT NULL
);


ALTER TABLE test.salary OWNER TO postgres;

--
-- Name: status; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.status (
    status_id integer NOT NULL,
    status_name character varying(20) NOT NULL
);


ALTER TABLE test.status OWNER TO postgres;

--
-- Name: status_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.status_id_seq OWNER TO postgres;

--
-- Name: status_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: postgres
--

ALTER SEQUENCE test.status_id_seq OWNED BY test.status.status_id;


--
-- Name: sub_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.sub_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.sub_id_seq OWNER TO postgres;

--
-- Name: sub_sub_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.sub_sub_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.sub_sub_id_seq OWNER TO postgres;

--
-- Name: sub; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.sub (
    id bigint DEFAULT nextval('test.sub_id_seq'::regclass) NOT NULL,
    sub_id integer DEFAULT nextval('test.sub_sub_id_seq'::regclass) NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(250),
    price json NOT NULL,
    channels json NOT NULL,
    collaboration json,
    visible boolean DEFAULT true NOT NULL
);


ALTER TABLE test.sub OWNER TO postgres;

--
-- Name: sub2_pool; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.sub2_pool (
    id bigint NOT NULL,
    sub_amount numeric(12,2) NOT NULL,
    sub_period integer NOT NULL,
    sub_name character varying(50) NOT NULL,
    transaction_when timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE test.sub2_pool OWNER TO postgres;

--
-- Name: sub_pool; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.sub_pool (
    id bigint NOT NULL,
    sub_id integer NOT NULL,
    expires timestamp without time zone NOT NULL,
    renew boolean DEFAULT true NOT NULL
);


ALTER TABLE test.sub_pool OWNER TO postgres;

--
-- Name: tpay_transactions; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.tpay_transactions (
    id bigint NOT NULL,
    tpay_id bigint NOT NULL,
    amount integer,
    tpay_when timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20),
    recurrent_token character varying(256),
    payment_url character varying(256)
);


ALTER TABLE test.tpay_transactions OWNER TO postgres;

--
-- Name: tpay_transactions_tpay_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.tpay_transactions_tpay_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.tpay_transactions_tpay_id_seq OWNER TO postgres;

--
-- Name: tpay_transactions_tpay_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: postgres
--

ALTER SEQUENCE test.tpay_transactions_tpay_id_seq OWNED BY test.tpay_transactions.tpay_id;


--
-- Name: users; Type: TABLE; Schema: test; Owner: postgres
--

CREATE TABLE test.users (
    id bigint NOT NULL,
    balance numeric(11,2) DEFAULT 0 NOT NULL,
    ice numeric(11,2) DEFAULT 0 NOT NULL,
    notification json DEFAULT '{}'::json NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    game_exp bigint DEFAULT 0 NOT NULL,
    auto_deposit character varying(256) DEFAULT NULL::character varying
);


ALTER TABLE test.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: test; Owner: postgres
--

CREATE SEQUENCE test.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: postgres
--

ALTER SEQUENCE test.users_id_seq OWNED BY test.users.id;


--
-- Name: backups id; Type: DEFAULT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.backups ALTER COLUMN id SET DEFAULT nextval('test.backups_id_seq'::regclass);


--
-- Name: donate donate_id; Type: DEFAULT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.donate ALTER COLUMN donate_id SET DEFAULT nextval('test.donate_donate_id_seq'::regclass);


--
-- Name: gift_pool gift_id; Type: DEFAULT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.gift_pool ALTER COLUMN gift_id SET DEFAULT nextval('test.gift_pool_gift_id_seq'::regclass);


--
-- Name: status status_id; Type: DEFAULT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.status ALTER COLUMN status_id SET DEFAULT nextval('test.status_id_seq'::regclass);


--
-- Name: tpay_transactions tpay_id; Type: DEFAULT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.tpay_transactions ALTER COLUMN tpay_id SET DEFAULT nextval('test.tpay_transactions_tpay_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.users ALTER COLUMN id SET DEFAULT nextval('test.users_id_seq'::regclass);


--
-- Data for Name: backups; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.backups (id, filename, created_at, size, description) FROM stdin;
4	backup-2025-05-17T14-41-58-995Z.sql	2025-05-17 17:41:59.471861	15465	уцу
\.


--
-- Data for Name: bank_pool; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.bank_pool (id, bank_transaction, bank_type, bank_amount, transaction_when, bank_real_amount) FROM stdin;
\.


--
-- Data for Name: channels; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.channels (id, channel_name, channel_id, channel_link) FROM stdin;
\.


--
-- Data for Name: donate; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.donate (id, donate_name, donate_description, donate_goal, donate_filled, visible, donate_id) FROM stdin;
\.


--
-- Data for Name: donate_pool; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.donate_pool (id, donate_id, donate_amount, transaction_when, donate_name) FROM stdin;
\.


--
-- Data for Name: gift_pool; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.gift_pool (gift_id, message, sub_id, sub_period, owner_id, taker_id, visible, gift_creates, gift_sent) FROM stdin;
\.


--
-- Data for Name: merchant; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.merchant (id, merchant_name) FROM stdin;
3	Магазин А
4	Магазин Б
2	Магазин 2
1	Shop
\.


--
-- Data for Name: salary; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.salary (id, salary_day, salary_props) FROM stdin;
2	2	{}
3	10	{}
4	25	{}
1	26	{}
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.status (status_id, status_name) FROM stdin;
\.


--
-- Data for Name: sub; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.sub (id, sub_id, name, description, price, channels, collaboration, visible) FROM stdin;
2	2	Подписка Премиум	\N	{"month": 100, "year": 1000}	["channel3", "channel4"]	{}	t
3	3	Подписка VIP	\N	{"month": 200, "year": 2000}	["channel5", "channel6"]	{}	t
1	1	Подписка Базовая	\N	{"month":50,"year":500}	["channel1", "channel2"]	{}	t
\.


--
-- Data for Name: sub2_pool; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.sub2_pool (id, sub_amount, sub_period, sub_name, transaction_when) FROM stdin;
\.


--
-- Data for Name: sub_pool; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.sub_pool (id, sub_id, expires, renew) FROM stdin;
\.


--
-- Data for Name: tpay_transactions; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.tpay_transactions (id, tpay_id, amount, tpay_when, status, recurrent_token, payment_url) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: test; Owner: postgres
--

COPY test.users (id, balance, ice, notification, status, game_exp, auto_deposit) FROM stdin;
1	16.00	15.00	{}	0	0	\N
2	16.00	14.00	{}	0	0	\N
10	100.00	50.00	{}	0	1000	true
13	300.00	80.00	{}	1	3000	false
11	201.00	75.00	{}	1	2000	false
12	150.00	60.00	{}	0	1500	true
\.


--
-- Name: backups_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.backups_id_seq', 4, true);


--
-- Name: donate_donate_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.donate_donate_id_seq', 1, false);


--
-- Name: gift_pool_gift_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.gift_pool_gift_id_seq', 1, false);


--
-- Name: merchant_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.merchant_id_seq', 7, true);


--
-- Name: status_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.status_id_seq', 1, false);


--
-- Name: sub_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.sub_id_seq', 6, true);


--
-- Name: sub_sub_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.sub_sub_id_seq', 6, true);


--
-- Name: tpay_transactions_tpay_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.tpay_transactions_tpay_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: test; Owner: postgres
--

SELECT pg_catalog.setval('test.users_id_seq', 13, true);


--
-- Name: backups backups_pkey; Type: CONSTRAINT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.backups
    ADD CONSTRAINT backups_pkey PRIMARY KEY (id);


--
-- Name: merchant merchant_pkey; Type: CONSTRAINT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.merchant
    ADD CONSTRAINT merchant_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: test; Owner: postgres
--

ALTER TABLE ONLY test.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_backups_created_at; Type: INDEX; Schema: test; Owner: postgres
--

CREATE INDEX idx_backups_created_at ON test.backups USING btree (created_at);


--
-- PostgreSQL database dump complete
--

