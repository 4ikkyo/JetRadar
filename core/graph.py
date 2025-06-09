# core/graph.py

"""
У цьому модулі можна розташувати допоміжну логіку для побудови
графа транзакцій: із списку транзакцій (JSON з TonAPI) –> граф у вигляді dict:
{
  "nodes": [ {"id":<address>, "label":<alias_or_address>, "meta":{…}}, … ],
  "edges": [ {"from":<src>, "to":<dst>, "value":<кількість транзакцій>,
             "sum_ton":<сума TON>, "last_ts":<timestamp>}, … ]
}
"""

from collections import defaultdict
from datetime import datetime


def build_transaction_graph(tx_list: list[dict], alias_map: dict[str, str] = None):
    """
    Приймає `tx_list` – список JSON-транзакцій від TonAPI.
    Повертає просту структуру { nodes: [...], edges: [...] }.

    alias_map: словник { address: alias }, використовується, щоб підставити
    людський псевдонім (alias) для вузла, якщо він є у ваших UserWallet.alias.
    """

    if alias_map is None:
        alias_map = {}

    nodes = {}
    edges_temp = defaultdict(lambda: {"count": 0, "sum_ton": 0, "last_ts": 0})

    for tx in tx_list:
        # Беремо тільки ті транзакції, де transaction_type=="TransOrd"
        if tx.get("transaction_type") != "TransOrd":
            continue

        # Обробка in_msg / out_msgs аналогічно до бота
        in_msg = tx.get("in_msg", {}) or {}
        out_msgs = tx.get("out_msgs", []) or []

        val_in = in_msg.get("value", 0)
        if val_in:
            src = in_msg.get("src", None)
            dst = tx.get("account", {}).get("address", None)
            amount = val_in
            ts = tx.get("utime", 0)

            if src and dst:
                # Сумуємо у тимчасовому словнику
                key = (src, dst)
                edges_temp[key]["count"] += 1
                edges_temp[key]["sum_ton"] += amount
                edges_temp[key]["last_ts"] = max(edges_temp[key]["last_ts"], ts)

                # Реєструємо вузли
                nodes[src] = {"id": src, "label": alias_map.get(src, src)}
                nodes[dst] = {"id": dst, "label": alias_map.get(dst, dst)}

        # Якщо є out_msgs
        if out_msgs:
            for out in out_msgs:
                dst = out.get("dst", None)
                src = tx.get("account", {}).get("address", None)
                amount = out.get("value", 0)
                ts = tx.get("utime", 0)

                if src and dst and amount:
                    key = (src, dst)
                    edges_temp[key]["count"] += 1
                    edges_temp[key]["sum_ton"] += amount
                    edges_temp[key]["last_ts"] = max(edges_temp[key]["last_ts"], ts)

                    nodes[src] = {"id": src, "label": alias_map.get(src, src)}
                    nodes[dst] = {"id": dst, "label": alias_map.get(dst, dst)}

    # Тепер перетворимо edges_temp у список
    edges = []
    for (src, dst), info in edges_temp.items():
        edges.append(
            {
                "from": src,
                "to": dst,
                "value": info["count"],
                "sum_ton": round(info["sum_ton"] / 1e9, 9),  # конвертуємо nanoton → TON
                "last_date": datetime.fromtimestamp(info["last_ts"]).strftime("%Y-%m-%d %H:%M"),
            }
        )

    return {"nodes": list(nodes.values()), "edges": edges}
