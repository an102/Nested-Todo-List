jQuery(function ($) {
    'use strict';

    const ENTER_KEY = 13;
    const ESC_KEY = 27;

    var util = {
        store: function (namespace, data) {
            if (arguments.length > 1) {
                return localStorage.setItem(namespace, JSON.stringify(data));
            } else {
                var store = localStorage.getItem(namespace);
                return (store && JSON.parse(store)) || [];
            }
        },
        uuid: function () {
            var i, random;
            var uuid = '';

            for (i = 0; i < 32; i++) {
                random = Math.random() * 16 | 0;
                if (i === 8 || i === 12 || i === 16 || i === 20) {
                    uuid += '-';
                }
                uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
            }
            return uuid;
        },
    }

    var app = {
        init: function () {
            this.todos = util.store('stored-todos');
            this.todoListTemplate = Handlebars.compile($('#todo-list-template').html());
            this.bindEvents();
            this.render();
        },

        storeInLocalStorage: function () {
            util.store('stored-todos', this.todos);
        },

        bindEvents: function () {
            $('body').on('mouseup', '.add-parent-list-todo', this.enterTodoText.bind(this));
            $('#toggle-all-checkbox').on('change', this.toggleAll.bind(this));
            $('#delete-completed').on('mouseup', this.deleteCompleted.bind(this));
            $('.parent-list')
                .on('focusin', '.todo-input-initiation', this.animateItemLine.bind(this))
                .on('keyup', '.todo-input-initiation', this.initialKeyCheck.bind(this))
                .on('keyup', '.todo-input', this.keyCheck.bind(this))
                .on('mouseup', '.delete', this.delete.bind(this))
                .on('focusout', '.todo-input-initiation', this.focusoutInitialInputCheck.bind(this))
                .on('focusout', '.todo-input', this.focusoutInputCheck.bind(this))
                .on('mouseup', '.todo-checkbox', this.toggleCompleted.bind(this));
        },

        enterTodoText: function (e) {
            if (e.which !== 1) {
              return;
            }
          
            var parentList = $(e.target).next().next().attr('id');
            var childListId = this.generateChildListId();

            this.todos.push({
                text: '',
                id: util.uuid(),
                completed: false,
                parentList: parentList,
                childList: "list-" + childListId,
            });

            this.render();
            $('body').find('#list-' + childListId).parent().find('.todo-input-initiation').focus()
        },

        animateItemLine: function (e) {
            var el = e.target;
            var lineLength = 0;
            var interval = setInterval(frame, 0);
            function frame() {
                if (lineLength === 125) {
                    clearInterval(interval);
                } else {
                    lineLength++;
                    el.style.borderBottom = "2px solid rgb(83, 82, 82)";
                    el.style.width = lineLength + "px";
                }
            }
        },

        generateChildListId: function () {
            if (this.todos.length) {
                var childListArray = [];

                this.todos.forEach(function (todo) {
                    childListArray.push(Number(todo.childList.slice(5)));
                })

                childListArray.sort(function (a, b) {
                    return b - a;
                });

                return childListArray[0] + 1;
            } else {
                return 2;
            }
        },

        initialKeyCheck: function (e) {
            this.keyCheck(e);
        },

        keyCheck: function (e) {
            var currentTodoText = this.todos[this.indexFromEl(e.target)].text;

            if ((e.which === ESC_KEY && currentTodoText === '')) {
                this.delete(e);
                return;
            } else if (e.which === ESC_KEY || e.which === ENTER_KEY) {
                $(e.target).blur();
            }
        },

        focusoutInitialInputCheck: function (e) {
            this.focusoutInputCheck(e);
        },

        focusoutInputCheck: function (e) {
            var $inputVal = $(e.target).val().trim();

            if (!$inputVal) {
                this.delete(e);
            } else {
                this.confirm(e);
            }
        },

        confirm: function (e) {
            var $inputVal = $(e.target).val().trim();
            this.todos[this.indexFromEl(e.target)].text = $inputVal;
            this.storeInLocalStorage();
            this.render();
        },

        delete: function (e) {
            if (e.which === 2 || e.which === 3) {
              return;
            }
          
            var el = e.target;
            var indexOfElToDelete = this.indexFromEl(el);
            var childListToDelete = this.todos[indexOfElToDelete].childList;
            var elementDescendantsToDelete = $('body').find('#' + childListToDelete).find('li');
            this.todos.splice(indexOfElToDelete, 1);

            for (var i = 0; i < elementDescendantsToDelete.length; i++) {
                this.todos.splice(this.indexFromEl(elementDescendantsToDelete[i]), 1);
            }

            this.storeInLocalStorage();
            this.render()
        },

        deleteCompleted: function (e) {
            if (e.which !== 1) {
              return;
            }
          
            var i = this.todos.length;
            var elementDescendantsToDelete = [];

            while (i--) {
                if (this.todos[i].completed) {
                    this.todos.splice(i, 1);
                }
            }

            this.storeInLocalStorage();
            this.render();
        },

        indexFromEl: function (el) {
            var id = $(el).closest('li').data('id');
            var i = this.todos.length;

            while (i--) {
                if (this.todos[i].id === id) {
                    return i;
                }
            }
        },

        toggleCompleted: function (e) {
            if (e.which !== 1) {
              return;
            }
          
            var el = e.target;

            if (el.checked) {
                el.checked = false;
            } else {
                el.checked = true;
            }

            var indexOfCompleted = this.indexFromEl(el);
            var checkedOrNot = $(e.target).prop('checked');
            this.todos[indexOfCompleted].completed = checkedOrNot;

            var descendantsToToggle = $(e.target).closest('li').find('ul').find('li');

            for (var i = 0; i < descendantsToToggle.length; i++) {
                this.todos.forEach(function (todo) {
                    if ($(descendantsToToggle[i]).data('id') === todo.id) {
                        todo.completed = checkedOrNot;
                    }
                })
            }

            this.storeInLocalStorage();
            this.render();
        },

        toggleAll: function (e) {
            var checkedOrNot = $(e.target).prop('checked');

            this.todos.forEach(function (todo) {
                todo.completed = checkedOrNot;
            });

            this.storeInLocalStorage();
            this.render();
        },

        render: function () {
            // array contaning id names of each distinct ul parentList
            var parentListArray = [];

            this.todos.forEach(function (todo) {
                this.todos.forEach(function (crossCheckTodo) {
                    if (!parentListArray.includes(todo.parentList)
                        && (crossCheckTodo.childList === todo.parentList || todo.parentList === "list-1")) {
                        parentListArray.push(todo.parentList);
                    }
                });
            }, this);

            // passes each templated li todo to the appropriate ul parentList 
            if (parentListArray.length) {
                for (var i = 0; i < parentListArray.length; i++) {
                    var parentListFormatted = "#" + parentListArray[i];
                    var filteredTodoList = this.todos.filter(function (todo) {
                        return todo.parentList === parentListArray[i];
                    });
                    $(parentListFormatted).html(this.todoListTemplate(filteredTodoList));
                }
            } else {
                $('#list-1').html(this.todoListTemplate(this.todos));
            }

            var numOfCompletedTodos = 0;

            // add checks in checkboxes if todos are completed
            this.todos.forEach(function (todo) {
                if (todo.completed) {
                    $('body').find('#' + todo.childList).closest('li').find('.todo-checkbox')[0].checked = true;
                    numOfCompletedTodos++;
                }
            })

            // add check in toggle all if all todos are completed
            if (this.todos.length && numOfCompletedTodos === this.todos.length) {
                $('body').find('#toggle-all-checkbox')[0].checked = true;
            } else {
                $('body').find('#toggle-all-checkbox')[0].checked = false;
            }
        }
    }
    app.init();
});