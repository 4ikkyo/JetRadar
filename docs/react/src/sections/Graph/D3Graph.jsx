import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { debounce } from 'lodash'; // Убедитесь, что lodash установлен: npm install lodash

// --- ADVANCED GRAPH SECTION ---
// Этот компонент рендерит силовую диаграмму с использованием D3.js, оптимизированную для связей кошельков.
// Он включает в себя улучшения производительности, улучшенную интерактивность для мобильных и настольных устройств,
// функции доступности и заготовки для дальнейшей интеграции.
const D3Graph = ({ graphData, onNodeClick, setTooltipContent, setTooltipPosition, setShowTooltip, searchTerm, tokenFilter }) => {
    // Ссылка на SVG-элемент
    const svgRef = useRef();
    // Состояние для отслеживания текущего активного (нажатого) узла
    const [activeNode, setActiveNode] = useState(null);
    // Ссылка на родительский контейнер для относительного позиционирования внешних элементов, таких как тултипы
    const containerRef = useRef(null);
    // Состояние для управления текущим преобразованием (масштабирование/панорамирование) для согласованного позиционирования тултипов
    // currentTransform используется для корректного позиционирования тултипов при зуме/панорамировании.
    const [currentTransform, setCurrentTransform] = useState(d3.zoomIdentity);

    // useCallback для функций, которые не нужно пересоздавать при каждом рендере
    // Проверяет, соединены ли два узла какой-либо связью в графе
    const isConnected = useCallback((nodeAId, nodeBId, links) => {
        return links.some(l =>
            (l.source.id === nodeAId && l.target.id === nodeBId) ||
            (l.source.id === nodeBId && l.target.id === nodeAId)
        );
    }, []);

    // Функция для отображения тултипа/деталей узла
    const showNodeTooltip = useCallback((event, d) => {
        // Убедитесь, что установщики состояния тултипа предоставлены перед вызовом
        if (setTooltipContent) setTooltipContent(d);
        if (setTooltipPosition) {
            // Используем clientX/Y для позиционирования тултипа относительно окна браузера,
            // а не относительно SVG, чтобы он всегда был видим.
            setTooltipPosition({
                left: `${event.clientX}px`,
                top: `${event.clientY + 20}px` // Смещение тултипа немного ниже курсора
            });
        }
        if (setShowTooltip) setShowTooltip(true);
    }, [setTooltipContent, setTooltipPosition, setShowTooltip]);

    // Основной хук эффекта D3
    useEffect(() => {
        // Очистите SVG и вернитесь, если нет данных графа
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            d3.select(svgRef.current).selectAll("*").remove();
            console.warn("Данные графа пусты или недействительны. Очистка SVG.");
            return;
        }

        const svgElement = d3.select(svgRef.current);
        svgElement.selectAll("*").remove(); // Очистить предыдущее содержимое SVG при повторном рендеринге

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        // Примените фильтрацию на основе searchTerm и tokenFilter
        const filteredNodes = graphData.nodes.filter(node => {
            const matchesSearch = searchTerm ?
                (node.name && node.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (node.address && node.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (node.id && node.id.toLowerCase().includes(searchTerm.toLowerCase())) :
                true;
            const matchesToken = tokenFilter ? node.tokenType === tokenFilter : true;
            return matchesSearch && matchesToken;
        });

        const filteredLinks = graphData.links.filter(link => {
            // Включать только связи, где и исходный, и целевой узлы находятся в отфильтрованном наборе
            return filteredNodes.some(n => n.id === link.source) && // Здесь d.source - это ID, а не объект
                   filteredNodes.some(n => n.id === link.target);  // Здесь d.target - это ID, а не объект
        });

        // Преобразование объектов link.source и link.target из ID в объекты узлов
        const linksWithNodeObjects = filteredLinks.map(link => ({
            ...link,
            source: filteredNodes.find(node => node.id === link.source),
            target: filteredNodes.find(node => node.id === link.target)
        })).filter(link => link.source && link.target); // Убедиться, что оба узла найдены

        // Инициализируйте симуляцию силы D3
        const simulation = d3.forceSimulation(filteredNodes)
            .force("link", d3.forceLink(linksWithNodeObjects).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-400)) // Отталкивать узлы
            .force("center", d3.forceCenter(width / 2, height / 2)) // Центрировать граф
            .force("x", d3.forceX(width / 2).strength(0.1)) // Держать узлы по горизонтали по центру
            .force("y", d3.forceY(height / 2).strength(0.1)); // Держать узлы по вертикали по центру
            // TODO: Рассмотрите возможность добавления d3-force-cluster для визуальной группировки связанных кошельков.
            // force-cluster не является частью d3 по умолчанию и требует отдельной установки.
            // .force("cluster", forceCluster().centers(d => d.groupId || d.tokenType).strength(0.2));

        // Создайте группу SVG для преобразований масштабирования/панорамирования
        const g = svgElement.append("g");

        // Определите маркеры стрелок для направленных связей
        svgElement.append("defs").selectAll("marker")
            .data(["arrow"]) // Уникальный ID для маркера стрелки
            .enter().append("marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10") // Viewbox для маркера
            .attr("refX", 15) // Позиция кончика стрелки относительно конца линии
            .attr("refY", -0.5) // Регулирует вертикальное положение для центрирования
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto") // Ориентирует стрелку вдоль пути
            .append("path")
            .attr("d", "M0,-5L10,0L0,5") // Путь для головки стрелки
            .attr("fill", "#999"); // Цвет стрелки

        // Создайте связи
        const link = g.append("g")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(linksWithNodeObjects) // Используйте ссылки с объектами узлов
            .join("line")
            .attr("class", "graph-link")
            .attr("stroke", "#999")
            .attr("stroke-width", l => l.value ? Math.sqrt(l.value) / 2 + 0.5 : 1.5) // Динамическая ширина на основе значения связи (например, суммы транзакции)
            .attr("marker-end", "url(#arrow)"); // Применить маркер стрелки

        // Создайте текстовые метки для связей (например, сумма транзакции)
        // Это может быть визуально сложно для управления беспорядком, особенно для плотных графов.
        const linkText = g.append("g")
            .attr("class", "link-texts")
            .selectAll("text")
            .data(linksWithNodeObjects) // Используйте ссылки с объектами узлов
            .join("text")
            .attr("class", "link-text") // Применяем класс из global.css
            .text(l => l.value ? `${l.value}` : ''); // Отображать значение связи, если оно доступно

        // Создайте узлы
        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("g")
            .data(filteredNodes) // Используйте отфильтрованные узлы
            .join("g")
            .attr("class", "graph-node")
            // Атрибуты доступности
            .attr("tabindex", "0") // Сделать узел доступным для фокусировки с клавиатуры
            .attr("role", "img") // Указать, что это изображение (визуальное представление)
            .attr("aria-label", d => `Кошелек: ${d.name || d.id}, Тип токена: ${d.tokenType || 'Неизвестно'}, Баланс: ${d.balance || 'N/A'}`); // Подробное описание для программ чтения с экрана

        // Круги узлов
        node.append("circle")
            .attr("r", 8)
            .attr("fill", d => d.tokenType === 'TON' ? '#4F46E5' : '#F59E0B'); // Цвет в зависимости от типа токена

        // Текстовые метки узлов
        node.append("text")
            .text(d => d.name || d.id.substring(0, 6) + '...') // Отображать имя или усеченный ID
            .attr('x', 0)
            .attr('y', 15)
            .attr("class", "node-text") // Применяем класс из global.css
            .attr("stroke", "none");

        // Поведение масштабирования и панорамирования с debounce для производительности
        // `d3.zoomIdentity` - это начальное преобразование без масштабирования и смещения.
        const debouncedZoom = debounce((event) => {
            g.attr("transform", event.transform);
            setCurrentTransform(event.transform); // Обновить текущее состояние преобразования
            if (setShowTooltip) setShowTooltip(false);
        }, 50); // Время debounce 50 мс

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4]) // Разрешить масштабирование от 10% до 400%
            .on("zoom", debouncedZoom);
        svgElement.call(zoom);

        // Поведение перетаскивания для узлов
        const dragBehavior = useCallback(d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; // Фиксировать положение узла во время перетаскивания
                d.fy = d.y;
                if (setShowTooltip) setShowTooltip(false);
            })
            .on("drag", (event, d) => {
                d.fx = event.x; // Обновить фиксированное положение
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                // При желании можно открепить узлы после перетаскивания, иначе они останутся фиксированными
                d.fx = null; // Отпустить узел после перетаскивания
                d.fy = null;
            }), [simulation, setShowTooltip]); // Зависимости для useCallback

        node.call(dragBehavior);

        // --- ИНТЕРАКТИВНОСТЬ ---

        // Обработка кликов по узлам
        node.on("click", function(event, d) {
            event.stopPropagation(); // Предотвратить клик по фону SVG от отмены выделения
            if (setShowTooltip) setShowTooltip(false); // Скрыть тултип при клике

            if (activeNode === d.id) {
                setActiveNode(null); // Отменить выделение, если уже активно
            } else {
                setActiveNode(d.id); // Выбрать узел
                // Вызвать обработчик родителя, возможно, для отображения подробного модального окна/боковой панели
                onNodeClick(d);
                // Здесь можно добавить логику для глубоких ссылок Telegram:
                // window.open(`tg://resolve?domain=${d.id}`, '_blank');
            }
        });

        // Двойной клик (или двойной тап) для центрирования и масштабирования узла
        node.on("dblclick", function(event, d) {
            event.stopPropagation();
            const newScale = 2; // Желаемый уровень масштабирования при двойном клике
            const newTransform = d3.zoomIdentity
                .translate(width / 2, height / 2) // Центр SVG
                .scale(newScale) // Увеличить
                .translate(-d.x, -d.y); // Переместить, чтобы центрировать нажатый узел
            svgElement.transition().duration(750).call(zoom.transform, newTransform);
        });

        // Навигация с клавиатуры для доступности
        node.on("keydown", function(event, d) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault(); // Предотвратить прокрутку по умолчанию для пробела
                event.stopPropagation();
                if (activeNode === d.id) {
                    setActiveNode(null);
                } else {
                    setActiveNode(d.id);
                    onNodeClick(d);
                }
            }
            // Добавьте больше событий клавиш для навигации, если необходимо (например, стрелки)
        });

        // Клик по фону SVG для сброса выделения
        svgElement.on("click", () => setActiveNode(null));


        // Тултип при долгом нажатии (сенсорные устройства) и наведении мышью
        let pressTimer;
        const LONG_PRESS_DURATION = 500; // миллисекунд для долгого нажатия

        node.on("touchstart", function(event, d) {
            event.preventDefault(); // Предотвратить поведение касания по умолчанию (например, прокрутку, контекстное меню)
            event.stopPropagation(); // Остановить распространение, чтобы избежать помех масштабированию/панорамированию
            pressTimer = setTimeout(() => showNodeTooltip(event, d), LONG_PRESS_DURATION);
        })
        .on("touchend", function() {
            clearTimeout(pressTimer); // Очистить таймер, если касание заканчивается до долгого нажатия
        })
        .on("touchmove", function() {
            clearTimeout(pressTimer); // Отменить долгое нажатие, если палец движется
            if (setShowTooltip) setShowTooltip(false); // Скрыть тултип при движении
        });

        node.on("mouseover", function(event, d) {
            if (window.innerWidth >= 768) { // Показывать при наведении только для больших экранов (без сенсорного ввода)
                showNodeTooltip(event, d);
            }
        })
        .on("mouseout", function() {
            if (window.innerWidth >= 768) {
                if (setShowTooltip) setShowTooltip(false);
            }
        });

        // --- ТИК СИМУЛЯЦИИ ---
        simulation.on("tick", () => {
            // Обновить позиции связей
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            // Обновить позиции узлов
            node.attr("transform", d => `translate(${d.x}, ${d.y})`);

            // Обновить позиции текста связей (центрировано на связи)
            linkText
                .attr("x", d => (d.source.x + d.target.x) / 2)
                .attr("y", d => (d.source.y + d.target.y) / 2);

            // Применить подсветку/затемнение на основе activeNode
            node.classed("highlighted-node", d => d.id === activeNode);
            link.classed("highlighted-link", l => l.source.id === activeNode || l.target.id === activeNode);

            // Затемнить неактивные узлы и связи
            if (activeNode) {
                node.classed("dimmed", d => d.id !== activeNode && !isConnected(d.id, activeNode, linksWithNodeObjects));
                link.classed("dimmed", l => l.source.id !== activeNode && l.target.id !== activeNode);
            } else {
                node.classed("dimmed", false);
                link.classed("dimmed", false);
            }
        });

        // --- ОЧИСТКА ---
        return () => {
            // Удалить все элементы SVG
            svgElement.selectAll("*").remove();
            // Удалить все слушатели событий из SVG-элемента
            svgElement.on(".zoom", null);
            // Удалить все слушатели событий из выбора узлов
            node.on(".drag", null);
            node.on("click", null).on("dblclick", null).on("keydown", null).on("mouseover", null).on("mouseout", null);
            node.on("touchstart", null).on("touchend", null).on("touchmove", null);
            // Убедитесь, что тултип скрыт при размонтировании
            if (setShowTooltip) setShowTooltip(false);
            // Остановите симуляцию силы, чтобы предотвратить утечки памяти
            simulation.stop();
        };
    }, [
        graphData, activeNode, setShowTooltip, setTooltipContent, setTooltipPosition,
        isConnected, showNodeTooltip, searchTerm, tokenFilter, width, height // Добавьте width, height в зависимости, если они могут динамически изменяться
    ]);

    // Рендеринг контейнера графа
    return (
        <div ref={containerRef} className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 relative overflow-hidden">
            <svg ref={svgRef} className="w-full h-full"></svg>
            {/* TODO: Заполнитель для внешних компонентов пользовательского интерфейса, таких как:
                - Компонент тултипа (рендерится условно на основе состояния setShowTooltip)
                - Подробное модальное окно/боковая панель узла (запускается по onNodeClick)
                - Поля ввода поиска/фильтра (пропсы searchTerm, tokenFilter будут поступать от них)
                - Мини-карта для больших графов
            */}
        </div>
    );
};

export default D3Graph;
